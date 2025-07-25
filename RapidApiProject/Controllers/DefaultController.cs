using Microsoft.AspNetCore.Mvc;
using RapidApiProject.Entities;
using RapidApiProject.Models;

namespace RapidApiProject.Controllers
{
    public class DefaultController : Controller
    {
        public IActionResult Dashboard()
        {
            return View();
        }
    }
}
