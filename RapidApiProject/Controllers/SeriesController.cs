using Microsoft.AspNetCore.Mvc;
using RapidApiProject.Context;
using RapidApiProject.Entities;

namespace RapidApiProject.Controllers
{
    public class SeriesController : Controller
    {
        private readonly ListContext _context;

        public SeriesController(ListContext context)
        {
            _context = context;
        }

        public IActionResult Index(string filter = "all")
        {
            IQueryable<Series> seriesQuery = _context.Series;
            switch (filter.ToLower())
            {
                case "watched":
                    seriesQuery = seriesQuery.Where(g => g.Watched);
                    break;
                case "not-watched":
                    seriesQuery = seriesQuery.Where(g => !g.Watched);
                    break;
                case "all":
                default:
                    break;
            }
            if (filter == "rating")
            {
                seriesQuery = seriesQuery.OrderByDescending(m => m.Rating);
            }
            else
            {
                seriesQuery = seriesQuery.OrderByDescending(m => m.ID);
            }
            if (filter == "raiting-Not-Watched")
            {
                seriesQuery = seriesQuery.Where(x => !x.Watched).OrderByDescending(y => y.Rating);
            }
            var values = seriesQuery.ToList();
            ViewBag.totalPage = values.Count;
            ViewBag.Filter = filter;
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
        public async Task<IActionResult> EditWatch(int id, string returnUrl = null)
        {
            var value = await _context.Series.FindAsync(id);
            if (value != null)
            {
                value.Watched = !value.Watched;
                await _context.SaveChangesAsync();
            }

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return RedirectToAction("Index", "Series");
        }
    }
}
