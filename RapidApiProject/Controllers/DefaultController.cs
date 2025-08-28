using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.EntityFrameworkCore;
using RapidApiProject.Context;
using RapidApiProject.Entities;
using RapidApiProject.Models;
using RapidApiProject.Models.ViewModels;

namespace RapidApiProject.Controllers
{
    public class DefaultController : Controller
    {
        private readonly ListContext _db;
        public DefaultController(ListContext db) => _db = db;
        public async Task<IActionResult> Index(string type = "movie", string filter = "all", int page = 1, int pageSize = 8)
        {
            type = (type ?? "movie").ToLowerInvariant();
            filter = (filter ?? "all").ToLowerInvariant();
            page = Math.Max(1, page);
            pageSize = pageSize < 1 ? 8 : pageSize;

            IQueryable<MediaItemVM> query = BuildQuery(type);

            if (filter == "watched") query = query.Where(x => x.Watched);
            else if (filter == "not-watched") query = query.Where(x => !x.Watched);

            // rating string old. için burada güvenli bir string sıralama + Title ile devam ediyoruz.
            query = query.OrderByDescending(x => x.Rating).ThenBy(x => x.Title);

            var total = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            var vm = new MediaIndexVM
            {
                Items = items,
                Type = type,
                Filter = filter,
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = total
            };
            return View(vm);
        }

        private IQueryable<MediaItemVM> BuildQuery(string type)
        {
            var movies = _db.Movies.AsNoTracking().Select(m => new MediaItemVM
            {
                Id = m.ID,
                Title = m.Title,
                Image = m.Image,
                Rating = m.Rating,
                Description = m.Description,
                Watched = m.Watched,
                Type = Models.ViewModels.MediaType.Movie
            });

            var series = _db.Series.AsNoTracking().Select(s => new MediaItemVM
            {
                Id = s.ID,
                Title = s.Title,
                Image = s.Image,
                Rating = s.Rating,
                Description = s.Description,
                Watched = s.Watched,
                Type = Models.ViewModels.MediaType.Series
            });

            var games = _db.Games.AsNoTracking().Select(g => new MediaItemVM
            {
                Id = g.ID,
                Title = g.Title,
                Image = g.Image,
                Rating = g.Rating,
                Description = g.Description,
                Watched = g.Watched,
                Type = Models.ViewModels.MediaType.Game
            });

            return type switch
            {
                "series" => series,
                "game" => games,
                "all" => movies.Concat(series).Concat(games), 
                _ => movies
            };
        }

        public async Task<IActionResult> EditWatch(string type, int id, string? returnUrl)
        {
            switch ((type ?? "").ToLowerInvariant())
            {
                case "series":
                    var s = await _db.Series.FindAsync(id);
                    if (s == null) return NotFound();
                    s.Watched = !s.Watched; break;

                case "game":
                    var g = await _db.Games.FindAsync(id);
                    if (g == null) return NotFound();
                    g.Watched = !g.Watched; break;

                default:
                    var m = await _db.Movies.FindAsync(id);
                    if (m == null) return NotFound();
                    m.Watched = !m.Watched; break;
            }
            await _db.SaveChangesAsync();
            return !string.IsNullOrWhiteSpace(returnUrl)
                ? Redirect(returnUrl)
                : RedirectToAction(nameof(Index), new { type });
        }

        public async Task<IActionResult> DeleteItem(string type, int id, string? returnUrl)
        {
            switch ((type ?? "").ToLowerInvariant())
            {
                case "series":
                    var s = await _db.Series.FindAsync(id);
                    if (s == null) return NotFound();
                    _db.Series.Remove(s); break;

                case "game":
                    var g = await _db.Games.FindAsync(id);
                    if (g == null) return NotFound();
                    _db.Games.Remove(g); break;

                default:
                    var m = await _db.Movies.FindAsync(id);
                    if (m == null) return NotFound();
                    _db.Movies.Remove(m); break;
            }
            await _db.SaveChangesAsync();
            return !string.IsNullOrWhiteSpace(returnUrl)
                ? Redirect(returnUrl)
                : RedirectToAction(nameof(Index), new { type });
        }


        [HttpGet]
        public IActionResult Create(string type = "movie", string? returnUrl = null)
        {
            type = (type ?? "movie").ToLowerInvariant();
            if (type != "movie" && type != "series" && type != "game") type = "movie";

            var vm = new CreateMediaVM { Type = type };
            ViewBag.ReturnUrl = returnUrl;
            return View(vm);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(CreateMediaVM vm, string? returnUrl = null)
        {
            if (!ModelState.IsValid)
            {
                ViewBag.ReturnUrl = returnUrl;
                return View(vm);
            }

            switch ((vm.Type ?? "movie").ToLowerInvariant())
            {
                case "series":
                    _db.Series.Add(new Series
                    {
                        Title = vm.Title,
                        Image = vm.Image,
                        Rating = vm.Rating,               
                        Description = vm.Description,
                        Watched = vm.Watched
                    });
                    break;

                case "game":
                    _db.Games.Add(new Game
                    {
                        Title = vm.Title,
                        Image = vm.Image,
                        Rating = vm.Rating,
                        Description = vm.Description,
                        Watched = vm.Watched
                    });
                    break;

                default: 
                    _db.Movies.Add(new Movie
                    {
                        Title = vm.Title,
                        Image = vm.Image,
                        Rating = vm.Rating,
                        Description = vm.Description,
                        Watched = vm.Watched
                    });
                    break;
            }

            await _db.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(returnUrl))
                return Redirect(returnUrl);

            return RedirectToAction(nameof(Index), new { type = vm.Type });
        }

    }
}
