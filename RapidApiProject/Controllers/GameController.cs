using Microsoft.AspNetCore.Mvc;
using RapidApiProject.Context;

namespace RapidApiProject.Controllers
{
    public class GameController : Controller
    {
        private readonly ListContext _context;

        public GameController(ListContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var values = _context.Games.ToList();
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
            return RedirectToAction("Index");
        }
    }
}
