using System.Globalization;
using System;
using Microsoft.AspNetCore.Mvc;
using RapidApiProject.Context;
using RapidApiProject.Entities;
using Microsoft.EntityFrameworkCore;
using RapidApiProject.Models;

namespace RapidApiProject.Controllers
{
    public class TrainingController : Controller
    {
        private readonly ListContext _db;
        public TrainingController(ListContext db) => _db = db;

        // Yardımcı: haftanın pazartesi tarihini bul
        private static DateTime StartOfWeek(DateTime d)
        {
            var diff = (7 + (int)d.DayOfWeek - (int)DayOfWeek.Monday) % 7;
            return d.Date.AddDays(-diff);
        }

        // GET /Training/Planner?start=2025-08-11
        [HttpGet]
        public async Task<IActionResult> Planner(string? start = null)
        {
            var userId = "demo"; // Auth varsa buraya User.Identity.Name gibi koy
            DateTime weekStart = string.IsNullOrWhiteSpace(start)
                ? StartOfWeek(DateTime.Today)
                : DateTime.ParseExact(start, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            DateTime weekEnd = weekStart.AddDays(6);

            // 1) O hafta için (varsa) planı al, yoksa oluştur
            var program = await _db.TrainingPrograms
                .FirstOrDefaultAsync(p => p.UserId == userId && p.StartDate == weekStart);

            if (program == null)
            {
                program = new TrainingProgram
                {
                    Title = $"Hafta {weekStart:dd.MM} - {weekEnd:dd.MM}",
                    UserId = userId,
                    StartDate = weekStart,
                    EndDate = weekEnd,
                    IsTemplate = false
                };
                _db.TrainingPrograms.Add(program);
                await _db.SaveChangesAsync();

                // 2) 7 gün oluştur
                for (int i = 0; i < 7; i++)
                {
                    _db.TrainingDays.Add(new TrainingDay
                    {
                        ProgramId = program.Id,
                        DayDate = weekStart.AddDays(i),
                        Title = weekStart.AddDays(i).ToString("dddd", new CultureInfo("tr-TR"))
                    });
                }
                await _db.SaveChangesAsync();
            }

            // 3) Gün + öğeler
            var days = await _db.TrainingDays
                .Where(d => d.ProgramId == program.Id)
                .OrderBy(d => d.DayDate)
                .ToListAsync();

            var items = await _db.TrainingItems
                .Where(i => days.Select(d => d.Id).Contains(i.DayId))
                .OrderBy(i => i.SortOrder)
                .ThenBy(i => i.Id)
                .Select(i => new
                {
                    i.Id,
                    i.DayId,
                    i.Sets,
                    i.Reps,
                    i.RestSec,
                    i.Notes,
                    Exercise = new
                    {
                        i.ExerciseId,
                        Name = i.Exercise.Name,
                        Eq = i.Exercise.Equipment,
                        Diff = i.Exercise.Difficulty,
                        Mech = i.Exercise.Mechanics
                    }
                })
                .ToListAsync();

            var vm = new TrainingPlannerVM
            {
                ProgramId = program.Id,
                WeekStart = weekStart,
                Days = days.Select(d => new PlannerDayVM
                {
                    DayId = d.Id,
                    Date = d.DayDate ?? weekStart,
                    Title = d.Title ?? d.DayDate?.ToString("dddd", new CultureInfo("tr-TR")) ?? "",
                    Items = items.Where(x => x.DayId == d.Id)
                                 .Select(x => new PlannerItemVM
                                 {
                                     ItemId = x.Id,
                                     ExerciseId = x.Exercise.ExerciseId,
                                     ExerciseName = x.Exercise.Name,
                                     Equipment = x.Exercise.Eq,
                                     Mechanics = x.Exercise.Mech,
                                     Difficulty = x.Exercise.Diff,
                                     Sets = x.Sets,
                                     Reps = x.Reps,
                                     RestSec = x.RestSec
                                 }).ToList()
                }).ToList()
            };

            return View(vm);
        }

        // API: egzersiz arama (liste paneli doldurmak için)
        // GET /Training/SearchExercises?q=press&region=chest&take=50
        [HttpGet]
        public async Task<IActionResult> SearchExercises(string? q, string? region, int take = 50)
        {
            var query = _db.Exercises.Include(e => e.Category).AsNoTracking();

            if (!string.IsNullOrWhiteSpace(region))
                query = query.Where(e => e.Category.Slug == region);

            if (!string.IsNullOrWhiteSpace(q))
                query = query.Where(e => e.Name.Contains(q));

            var list = await query.OrderBy(e => e.Name).Take(take)
                .Select(e => new
                {
                    id = e.Id,
                    name = e.Name,
                    cat = e.Category.Name,
                    eq = e.Equipment,
                    diff = e.Difficulty,
                    mech = e.Mechanics
                }).ToListAsync();
            return Json(list);
        }

        // API: güne item ekle
        [HttpPost]
        public async Task<IActionResult> AddItem([FromForm] int dayId, [FromForm] int exerciseId,
                                                 [FromForm] int? sets, [FromForm] string? reps, [FromForm] int? restSec)
        {
            var maxSort = await _db.TrainingItems.Where(i => i.DayId == dayId)
                            .MaxAsync(i => (int?)i.SortOrder) ?? -1;

            _db.TrainingItems.Add(new TrainingItem
            {
                DayId = dayId,
                ExerciseId = exerciseId,
                SortOrder = maxSort + 1,
                Sets = sets,
                Reps = reps,
                RestSec = restSec
            });
            await _db.SaveChangesAsync();
            return Ok(new { ok = true });
        }

        // API: item sil
        [HttpPost]
        public async Task<IActionResult> RemoveItem([FromForm] int id)
        {
            var it = await _db.TrainingItems.FindAsync(id);
            if (it == null) return NotFound();
            _db.TrainingItems.Remove(it);
            await _db.SaveChangesAsync();
            return Ok(new { ok = true });
        }

        // API: item gün değiştir (taşıma)
        [HttpPost]
        public async Task<IActionResult> MoveItem([FromForm] int id, [FromForm] int toDayId)
        {
            var it = await _db.TrainingItems.FindAsync(id);
            if (it == null) return NotFound();
            it.DayId = toDayId;
            it.SortOrder = (await _db.TrainingItems.Where(x => x.DayId == toDayId)
                         .MaxAsync(x => (int?)x.SortOrder)) ?? -1;
            it.SortOrder++;
            await _db.SaveChangesAsync();
            return Ok(new { ok = true });
        }

        // HAZIR ŞABLONLAR: FullBody-3, PPL, UpperLower
        // POST /Training/ApplyTemplate
        [HttpPost]
        public async Task<IActionResult> ApplyTemplate([FromForm] int programId, [FromForm] string template)
        {
            var days = await _db.TrainingDays.Where(d => d.ProgramId == programId)
                         .OrderBy(d => d.DayDate).ToListAsync();
            if (days.Count < 7) return BadRequest();

            // Yardımcı: isimle egzersizId bul
            async Task<int?> E(string name)
                => await _db.Exercises.Where(e => e.Name == name).Select(e => (int?)e.Id).FirstOrDefaultAsync();

            // Basit hazır set (örnek)
            async Task Add(int dayIndex, string name, int sets, string reps, int rest)
            {
                var exId = await E(name); if (exId == null) return;
                _db.TrainingItems.Add(new TrainingItem
                {
                    DayId = days[dayIndex].Id,
                    ExerciseId = exId.Value,
                    SortOrder = 999,
                    Sets = sets,
                    Reps = reps,
                    RestSec = rest
                });
            }

            if (template == "fullbody-3")
            {
                // Pzt / Çrş / Cum
                await Add(0, "Back Squat", 5, "5", 120);
                await Add(0, "Barbell Bench Press", 5, "5", 120);
                await Add(0, "Barbell Bent-Over Row", 4, "8", 90);
                await Add(2, "Deadlift", 3, "5", 150);
                await Add(2, "Overhead Press (Barbell)", 5, "5", 120);
                await Add(2, "Pull-up", 4, "6-8", 90);
                await Add(4, "Walking Lunge", 4, "10", 90);
                await Add(4, "Incline Dumbbell Press", 4, "8-10", 90);
                await Add(4, "Lat Pulldown (Wide Grip)", 4, "10", 90);
            }
            else if (template == "ppl")
            {
                // Push / Pull / Legs (Pzt/Sali/Cars) + tekrar
                await Add(0, "Barbell Bench Press", 5, "5", 120);
                await Add(0, "Overhead Press (Barbell)", 4, "6-8", 120);
                await Add(1, "Pull-up", 5, "5", 120);
                await Add(1, "Seated Cable Row", 4, "8-10", 90);
                await Add(2, "Back Squat", 5, "5", 120);
                await Add(2, "Romanian Deadlift", 4, "6-8", 120);
            }
            else if (template == "upper-lower")
            {
                await Add(0, "Incline Barbell Bench Press", 5, "5", 120);
                await Add(0, "Barbell Bent-Over Row", 5, "5", 120);
                await Add(1, "Back Squat", 5, "5", 120);
                await Add(1, "Romanian Deadlift", 4, "6-8", 120);
                await Add(3, "Dumbbell Bench Press", 4, "8-10", 90);
                await Add(3, "Lat Pulldown (Close Grip)", 4, "10", 90);
                await Add(4, "Front Squat", 5, "3-5", 150);
                await Add(4, "Walking Lunge", 4, "10", 90);
            }

            await _db.SaveChangesAsync();
            // sortorder düzelt
            var grouped = await _db.TrainingItems.Where(i => days.Select(d => d.Id).Contains(i.DayId))
                            .OrderBy(i => i.SortOrder).ThenBy(i => i.Id).ToListAsync();
            foreach (var g in grouped.GroupBy(x => x.DayId))
            {
                int s = 0;
                foreach (var it in g) it.SortOrder = s++;
            }
            await _db.SaveChangesAsync();

            return Ok(new { ok = true });
        }
    }
}
