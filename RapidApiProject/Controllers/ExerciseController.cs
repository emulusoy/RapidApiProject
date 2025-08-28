using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RapidApiProject.Context;
using RapidApiProject.Models;

namespace RapidApiProject.Controllers
{
    public class ExerciseController : Controller
    {
        private readonly ListContext _db;
        public ExerciseController(ListContext db) => _db = db;

        public IActionResult Index()
        {
            return View();
        }
        [HttpGet]
        public async Task<IActionResult> Library(string? region, string? q, string? equipment, string? mechanics, string? difficulty,
                                                 int page = 1, int pageSize = 24)
        {
            var cats = await _db.ExerciseCategories
                .Select(c => new
                {
                    c.Slug,
                    c.Name,
                    c.Icon,
                    Count = c.Exercises.Count()
                })
                .OrderBy(c => c.Name)
                .ToListAsync();

            var query = _db.Exercises
                .Include(e => e.Category)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(region))
                query = query.Where(e => e.Category.Slug == region);

            if (!string.IsNullOrWhiteSpace(q))
                query = query.Where(e => e.Name.Contains(q));

            if (!string.IsNullOrWhiteSpace(equipment))
                query = query.Where(e => e.Equipment == equipment);

            if (!string.IsNullOrWhiteSpace(mechanics))
                query = query.Where(e => e.Mechanics == mechanics);

            if (!string.IsNullOrWhiteSpace(difficulty))
                query = query.Where(e => e.Difficulty == difficulty);

            var total = await query.CountAsync();

            var items = await query
                .OrderBy(e => e.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new ExerciseItemVM
                {
                    Id = e.Id,
                    Name = e.Name,
                    CategoryName = e.Category.Name,
                    Mechanics = e.Mechanics,
                    Difficulty = e.Difficulty,
                    Equipment = e.Equipment,
                    Image = e.Image
                })
                .ToListAsync();

            var vm = new ExerciseLibraryVM
            {
                Region = region,
                Q = q,
                Mechanics = mechanics,
                Equipment = equipment,
                Difficulty = difficulty,
                Page = page,
                PageSize = pageSize,
                Total = total,
                Categories = cats.Select(c => (c.Slug, c.Name, c.Icon, c.Count)).ToList(),
                Items = items
            };

            return View(vm);
        }
        [HttpGet]
        public async Task<IActionResult> Detail(int id)
        {
            var e = await _db.Exercises
                .Include(x => x.Category)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (e == null) return NotFound();

            var related = await _db.Exercises
                .Where(x => x.CategoryId == e.CategoryId && x.Id != id)
                .OrderBy(x => x.Name)
                .Take(8)
                .Select(x => new ExerciseItemVM
                {
                    Id = x.Id,
                    Name = x.Name,
                    CategoryName = x.Category.Name,
                    Mechanics = x.Mechanics,
                    Difficulty = x.Difficulty,
                    Equipment = x.Equipment,
                    Image = x.Image
                })
                .ToListAsync();

            var vm = new ExerciseDetailVM
            {
                Id = e.Id,
                Name = e.Name,
                CategoryName = e.Category.Name,
                Mechanics = e.Mechanics,
                Difficulty = e.Difficulty,
                Equipment = e.Equipment,
                Image = e.Image,
                VideoUrl = e.VideoUrl,
                Notes = e.Notes,
                PrimaryMuscles = e.PrimaryMuscles,
                SecondaryMuscles = e.SecondaryMuscles,
                IsFavorite = e.IsFavorite,
                Related = related
            };

            return View(vm);
        }

        [HttpPost]
        [IgnoreAntiforgeryToken] 
        public async Task<IActionResult> ToggleFavorite(int id)
        {
            var e = await _db.Exercises.FirstOrDefaultAsync(x => x.Id == id);
            if (e == null) return NotFound();
            e.IsFavorite = !e.IsFavorite;
            await _db.SaveChangesAsync();
            return Ok(new { ok = true, favorite = e.IsFavorite });
        }
        [HttpGet]
        public async Task<IActionResult> RegionList(string region, string? q, int take = 60)
        {
            if (string.IsNullOrWhiteSpace(region))
                return Json(new { ok = false, items = Array.Empty<object>(), message = "Bölge boş." });

            region = region.Trim().ToLowerInvariant();

            var toMain = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["biceps"] = "arms",
                ["forearms"] = "arms",
                ["triceps"] = "arms",

                ["quads"] = "legs",
                ["hamstrings"] = "legs",
                ["calves"] = "legs",

                ["traps"] = "back",
                ["lats"] = "back",
                ["lower-back"] = "back",
                ["rear-delts"] = "shoulders"
            };

            var main = toMain.TryGetValue(region, out var m) ? m : region;

            var query = _db.Exercises
                .Include(e => e.Category)
                .AsNoTracking()
                .Where(e => e.Category.Slug == main);

            if (!string.IsNullOrWhiteSpace(q))
            {
                q = q.Trim();
                query = query.Where(e =>
                    EF.Functions.Like(e.Name, $"%{q}%") ||
                    (e.PrimaryMuscles != null && EF.Functions.Like(e.PrimaryMuscles, $"%{q}%")) ||
                    (e.SecondaryMuscles != null && EF.Functions.Like(e.SecondaryMuscles, $"%{q}%")));
            }

            var items = await query
                .OrderBy(e => e.Name)
                .Take(Math.Max(1, take))
                .Select(e => new
                {
                    id = e.Id,
                    name = e.Name,
                    cat = e.Category.Name,
                    img = e.Image
                })
                .ToListAsync();

            return Json(new { ok = true, region, items });
        }
    }
}
