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
                case "watched":
                    gamesQuery = gamesQuery.Where(g => g.Watched);
                    break;
                case "not-watched":
                    gamesQuery = gamesQuery.Where(g => !g.Watched);
                    break;
                case "all":
                default:
                    break;
            }
            if (filter == "rating")
            {
                gamesQuery = gamesQuery.OrderByDescending(m => m.Rating);
            }
            else
            {
                gamesQuery = gamesQuery.OrderByDescending(m => m.ID);
            }
            if (filter == "raiting-Not-Watched")
            {
                gamesQuery = gamesQuery.Where(x => !x.Watched).OrderByDescending(y => y.Rating);
            }
            var values = gamesQuery.ToList();
            ViewBag.totalPage = values.Count;
            ViewBag.Filter = filter;
            return View(values);
        }
        public IActionResult _GamesCard()
        {
            return View();
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
        public async Task<IActionResult> EditWatch(int id, string returnUrl = null)
        {
            var value = await _context.Games.FindAsync(id);
            if (value != null)
            {
                value.Watched = !value.Watched;
                await _context.SaveChangesAsync();
            }

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return RedirectToAction("Index", "Game");
        }
    }
}
