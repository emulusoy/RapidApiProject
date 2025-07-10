using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using RapidApiProject.Models;

namespace RapidApiProject.Controllers
{
    public class BurgerMenuController : Controller
    {
        public async Task<IActionResult> Index()
        {
            var client = new HttpClient();
            var request = new HttpRequestMessage
            {
                Method = HttpMethod.Get,
                RequestUri = new Uri("https://burgers-hub.p.rapidapi.com/burgers"),
                Headers =
    {
        { "x-rapidapi-key", "9b2ad97b7dmsh73dc14b9e6ed0e7p1d4084jsnb1752d00f239" },
        { "x-rapidapi-host", "burgers-hub.p.rapidapi.com" }, 
    },
            };
            using (var response = await client.SendAsync(request))
            {
                response.EnsureSuccessStatusCode();
                var body = await response.Content.ReadAsStringAsync();
                var values = JsonConvert.DeserializeObject<List<BurgerMenuViewModel>>(body);
                return View(values.ToList());
            }
            
        }
    }
}
