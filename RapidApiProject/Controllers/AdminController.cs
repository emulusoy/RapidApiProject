using Microsoft.AspNetCore.Mvc;

namespace RapidApiProject.Controllers
{
    public class AdminController : Controller
    {
        public IActionResult Admin()
        {
            return View();
        }
    }
}
