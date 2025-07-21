using Microsoft.AspNetCore.Mvc;
using RapidApiProject.Context;
using RapidApiProject.Entities;

namespace RapidApiProject.Controllers
{
    public class GameController : Controller
    {
        private readonly ListContext _context;

        public GameController(ListContext context)
        {
            _context = context;
        }

        public IActionResult Index(string filter = "all")
        {
            IQueryable<Game> gamesQuery = _context.Games;
            switch (filter.ToLower())
            {
                case "played":
                    gamesQuery = gamesQuery.Where(g => g.Watched);
                    break;
                case "not-played":
                    gamesQuery = gamesQuery.Where(g => !g.Watched);
                    break;
                case "all":
                default:
                    break;
            }

            var values = gamesQuery.ToList();
            ViewBag.totalPage = values.Count; 

            return View(values);
        }
        public async Task<IActionResult> DeleteGame(int id)
        {
            var value = _context.Games.Find(id);
            ViewBag.totalPage=_context.Games.Count();
            if (value != null)
            {
                _context.Games.Remove(value);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction("Index", "Game");

        }
    }
}
