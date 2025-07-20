
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using RapidApiProject.Context;
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

        public async Task<IActionResult> Index()
        {
            var values = _context.Movies.ToList();
            return View(values);

        }
    }
}
