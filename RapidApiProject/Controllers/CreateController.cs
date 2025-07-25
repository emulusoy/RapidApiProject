using Microsoft.AspNetCore.Mvc;
using RapidApiProject.Context;
using RapidApiProject.Models;    // CreateViewModel burada
using RapidApiProject.Entities; // <-- Burayı değiştirdik: Movie, Series, Game modelleriniz burada
using System.Threading.Tasks;

namespace RapidApiProject.Controllers
{
    public class CreateController : Controller
    {
        private readonly ListContext _context;

        public CreateController(ListContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Index()
        {
            var viewModel = new CreateViewModel();
            return View(viewModel);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Index(CreateViewModel model)
        {
            if (ModelState.IsValid)
            {
                switch (model.SelectedType)
                {
                    case "Movie":
                        var movie = new Movie
                        {
                            Title = model.Title,
                            Image = model.Image,
                            Rating =double.Parse(model.Rating),
                            Description = model.Description,
                            Watched = model.Watched
                        };
                        _context.Movies.Add(movie);
                        break;
                    case "Series":
                        var series = new Series
                        {
                            Title = model.Title,
                            Image = model.Image,
                            Rating = model.Rating,
                            Description = model.Description,
                            Watched = model.Watched
                        };
                        _context.Series.Add(series);
                        break;
                    case "Game":
                        var game = new Game
                        {
                            Title = model.Title,
                            Image = model.Image,
                            Rating = model.Rating,
                            Description = model.Description,
                            Watched = model.Watched
                        };
                        _context.Games.Add(game);
                        break;
                    default:
                        ModelState.AddModelError("SelectedType", "Geçersiz bir tür seçimi yapıldı.");
                        return View(model);
                }

                await _context.SaveChangesAsync();
                var values = model.SelectedType;
                return RedirectToAction("Index", values);
            }
            return View(model);
        }
    }
}