
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using RapidApiProject.Context;
using RapidApiProject.Entities;
using RapidApiProject.Models;

namespace RapidApiProject.Controllers
{
    public class MovieController : Controller
    {
        private readonly ListContext _context;

        public MovieController(ListContext context)
        {
            _context = context;
        }
        public IActionResult Index(string filter = "all")
        {
            IQueryable<Movie> moviesQuery = _context.Movies;
            switch (filter.ToLower())
            {
                case "watched":
                    moviesQuery = moviesQuery.Where(g => g.Watched);
                    break;
                case "not-watched":
                    moviesQuery = moviesQuery.Where(g => !g.Watched);
                    break;
                case "all":
                default:
                    break;
            }

            var values = moviesQuery.ToList();
            ViewBag.totalPage = values.Count;

            return View(values);
        }
        public IActionResult _FilterOptions()
        {
            return View();
        }
        public IActionResult _MovieCard()
        {
            return View();
        }
        public async Task<IActionResult> DeleteMovie(int id)
        {
            var value = _context.Movies.Find(id);
            ViewBag.totalPage = _context.Movies.Count();
            if (value != null)
            {
                _context.Movies.Remove(value);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction("Index");
        }
        
        
    }
}
