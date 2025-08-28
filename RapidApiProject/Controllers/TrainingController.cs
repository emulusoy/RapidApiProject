using System.Text.Json;
using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RapidApiProject.Context;
using RapidApiProject.Entities;
using RapidApiProject.Models;
using System.ComponentModel.DataAnnotations;

namespace RapidApiProject.Controllers
{
    public class TrainingController : Controller
    {
        private readonly ListContext _db;
        public TrainingController(ListContext db) => _db = db;

        [HttpGet]
        public IActionResult PlanBuilder()
        {
            var vm = new PlanBuilderVM
            {
                Title = "",
                Items = new List<PlanBuilderItemVM>()
            };
            return View(vm);
        }
        [HttpGet]
        public async Task<IActionResult> SearchExercises(string? q, string? region, int take = 50)
        {
            try
            {
                var query = _db.Exercises
                    .Include(e => e.Category)
                    .AsNoTracking()
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(region))
                    query = query.Where(e => e.Category != null && e.Category.Slug == region);

                if (!string.IsNullOrWhiteSpace(q))
                    query = query.Where(e => e.Name.Contains(q));

                var items = await query
                    .OrderBy(e => e.Name)
                    .Take(take)
                    .Select(e => new
                    {
                        id = e.Id,
                        name = e.Name,
                        cat = e.Category != null ? e.Category.Name : null,
                        mech = e.Mechanics,
                        eq = e.Equipment,
                        diff = e.Difficulty,
                        img = e.Image 
                    })
                    .ToListAsync();

                return Ok(new { ok = true, items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { ok = false, message = ex.Message });
            }
        }
        public class SavePlanItemDto
        {
            public int exerciseId { get; set; }
            public int? sets { get; set; }
            public string? reps { get; set; }
            public int? restSec { get; set; }
            public int sort { get; set; }
        }

        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> SavePlan([FromForm, Required] string title, [FromForm, Required] string itemsJson)
        {
            if (string.IsNullOrWhiteSpace(title)) return BadRequest(new { ok = false, message = "Başlık gerekli." });

            List<SavePlanItemDto>? items;
            try
            {
                items = JsonSerializer.Deserialize<List<SavePlanItemDto>>(itemsJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch
            {
                return BadRequest(new { ok = false, message = "Geçersiz veri." });
            }

            if (items == null || items.Count == 0)
                return BadRequest(new { ok = false, message = "En az bir egzersiz ekleyin." });

            var userId = "demo"; 

            var program = new TrainingProgram
            {
                Title = title.Trim(),
                UserId = userId,
                StartDate = DateTime.Today,
                EndDate = DateTime.Today,
                IsTemplate = true
            };
            _db.TrainingPrograms.Add(program);
            await _db.SaveChangesAsync();


            var day = new TrainingDay
            {
                ProgramId = program.Id,
                Title = "Plan",
                DayDate = DateTime.Today
            };
            _db.TrainingDays.Add(day);
            await _db.SaveChangesAsync();

            int order = 0;
            foreach (var it in items.OrderBy(x => x.sort))
            {
                _db.TrainingItems.Add(new TrainingItem
                {
                    DayId = day.Id,
                    ExerciseId = it.exerciseId,
                    SortOrder = order++,
                    Sets = it.sets,
                    Reps = it.reps,
                    RestSec = it.restSec
                });
            }
            await _db.SaveChangesAsync();

            return Ok(new { ok = true, id = program.Id, redirect = Url.Action("MyPlans") });
        }
        [HttpGet]
        public async Task<IActionResult> MyPlans()
        {
            var userId = "demo";

            var list = await _db.TrainingPrograms
                .Where(p => p.UserId == userId && p.IsTemplate)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    FirstImg = p.Days
                        .SelectMany(d => d.Items)
                        .OrderBy(i => i.SortOrder)
                        .Select(i => i.Exercise.Image)
                        .FirstOrDefault(),
                    Count = p.Days.SelectMany(d => d.Items).Count()
                })
                .OrderByDescending(x => x.Id)
                .ToListAsync();

            var vm = new PlanListVM
            {
                Plans = list.Select(x => new PlanCardVM
                {
                    Id = x.Id,
                    Title = x.Title,
                    FirstImage = string.IsNullOrWhiteSpace(x.FirstImg)
                        ? "https://via.placeholder.com/800x600?text=Exercise"
                        : x.FirstImg,
                    ItemCount = x.Count
                }).ToList()
            };

            return View(vm);
        }
        [HttpGet]
        public async Task<IActionResult> PlanDetail(int id)
        {
            var program = await _db.TrainingPrograms
                .Include(p => p.Days)
                    .ThenInclude(d => d.Items)
                        .ThenInclude(i => i.Exercise)
                .ThenInclude(e => e.Category)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.IsTemplate);

            if (program == null) return NotFound();

            var allItems = program.Days
                .SelectMany(d => d.Items)
                .OrderBy(i => i.SortOrder)
                .ToList();

            var vm = new PlanDetailVM
            {
                Id = program.Id,
                Title = program.Title,
                CoverImage = allItems.Select(i => i.Exercise.Image)
                                     .FirstOrDefault(x => !string.IsNullOrWhiteSpace(x))
                             ?? "https://via.placeholder.com/800x600?text=Exercise",
                TotalItems = allItems.Count,
                Items = allItems.Select((i, idx) => new PlanDetailItemVM
                {
                    Order = idx + 1,
                    ExerciseId = i.ExerciseId,
                    Name = i.Exercise.Name,
                    Image = string.IsNullOrWhiteSpace(i.Exercise.Image)
                                ? "https://via.placeholder.com/800x600?text=Exercise"
                                : i.Exercise.Image,
                    Category = i.Exercise.Category != null ? i.Exercise.Category.Name : null,
                    Sets = i.Sets,
                    Reps = i.Reps,
                    RestSec = i.RestSec
                }).ToList()
            };

            return View(vm);
        }
    }
}
