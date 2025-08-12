using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RapidApiProject.Context;
using RapidApiProject.Entities;

namespace RapidApiProject.Controllers
{
    public class PlannerController : Controller
    {
        private readonly ListContext _db;
        public PlannerController(ListContext db) => _db = db;

        [HttpGet]
        public IActionResult Index(int? year, int? month)
        {
            var now = DateTime.Today;
            ViewBag.Year = year ?? now.Year;
            ViewBag.Month = month ?? now.Month;
            return View();
        }
        [HttpGet]
        public IActionResult Focus(string mode = "next")
        {
            ViewBag.Mode = mode;
            return View();
        }
        [HttpGet]
        public async Task<IActionResult> MonthData(int year, int month)
        {
            var from = new DateTime(year, month, 1);
            var to = from.AddMonths(1).AddDays(-1);

            var tasks = await _db.PlannerTasks
                .Where(t => t.ScheduledDate == null ||
                            (t.ScheduledDate >= from && t.ScheduledDate <= to))
                .OrderBy(t => t.ScheduledDate)
                .ThenBy(t => t.Title)
                .Select(t => new {
                    t.Id,
                    t.Title,
                    t.Notes,
                    ScheduledDate = t.ScheduledDate,
                    t.Scope,
                    t.Done,
                    t.Color
                })
                .ToListAsync();

            var goals = await _db.PlannerGoals
                .OrderBy(g => g.Scope).ThenBy(g => g.Title)
                .Select(g => new { g.Id, g.Title, g.Scope, g.Completed })
                .ToListAsync();

            return Json(new { tasks, goals });
        }
        public class TaskSaveDto
        {
            public int Id { get; set; }               
            public string Title { get; set; } = "";
            public string? Notes { get; set; }
            public DateTime? ScheduledDate { get; set; }  
            public string Scope { get; set; } = "day";
            public bool Done { get; set; }
            public string? Color { get; set; }
            public bool Deleted { get; set; }            
        }

        [HttpPost]
        [IgnoreAntiforgeryToken] 
        public async Task<IActionResult> Save([FromBody] List<TaskSaveDto> changed)
        {
            var now = DateTime.UtcNow;

            foreach (var dto in changed)
            {
                if (dto.Deleted)
                {
                    if (dto.Id > 0)
                    {
                        var del = await _db.PlannerTasks.FindAsync(dto.Id);
                        if (del != null) _db.PlannerTasks.Remove(del);
                    }
                    continue;
                }

                PlannerTask entity;
                if (dto.Id > 0)
                {
                    entity = await _db.PlannerTasks.FindAsync(dto.Id) ?? new PlannerTask();
                }
                else
                {
                    entity = new PlannerTask { CreatedAt = now };
                    _db.PlannerTasks.Add(entity);
                }

                entity.Title = dto.Title?.Trim() ?? "";
                entity.Notes = dto.Notes;
                entity.ScheduledDate = dto.ScheduledDate?.Date;
                entity.Scope = string.IsNullOrWhiteSpace(dto.Scope) ? "day" : dto.Scope;
                entity.Done = dto.Done;
                entity.Color = string.IsNullOrWhiteSpace(dto.Color) ? "indigo" : dto.Color;
                entity.UpdatedAt = now;
            }

            await _db.SaveChangesAsync();
            return Ok(new { ok = true });
        }

        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> QuickAdd([FromBody] TaskSaveDto dto)
        {
            var e = new PlannerTask
            {
                Title = dto.Title?.Trim() ?? "",
                Notes = dto.Notes,
                ScheduledDate = dto.ScheduledDate?.Date,
                Scope = string.IsNullOrWhiteSpace(dto.Scope) ? "day" : dto.Scope,
                Done = false,
                Color = string.IsNullOrWhiteSpace(dto.Color) ? "indigo" : dto.Color
            };
            _db.PlannerTasks.Add(e);
            await _db.SaveChangesAsync();
            return Json(new { id = e.Id });
        }
        [HttpPost]
        [IgnoreAntiforgeryToken] // İstersen AntiForgery ekleyelim
        public async Task<IActionResult> Delete(int id)
        {
            var e = await _db.PlannerTasks.FindAsync(id);
            if (e == null) return NotFound();
            _db.PlannerTasks.Remove(e);
            await _db.SaveChangesAsync();
            return Ok(new { ok = true });
        }
    }
}
