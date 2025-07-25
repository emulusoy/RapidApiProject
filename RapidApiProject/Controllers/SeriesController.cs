using Microsoft.AspNetCore.Mvc;
using RapidApiProject.Context;

namespace RapidApiProject.Controllers
{
    public class SeriesController : Controller
    {
        private readonly ListContext _context;

        public SeriesController(ListContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var values = _context.Series.ToList();
            ViewBag.totalPage = values.Count;
            return View(values);

        }
        public IActionResult _SeriesCard()
        {
            return View();
        }
        public async Task<IActionResult> DeleteSeries(int id)
        {
            var value = _context.Series.Find(id);
            ViewBag.totalPage = _context.Series.Count();
            if (value != null)
            {
                _context.Series.Remove(value);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction("Index");
        }
    }
}
