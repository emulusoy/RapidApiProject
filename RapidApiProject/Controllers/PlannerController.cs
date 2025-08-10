using Microsoft.AspNetCore.Mvc;

namespace RapidApiProject.Controllers
{
    public class PlannerController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
        public IActionResult Focus()
        {
            return View();
        }
    }
}
