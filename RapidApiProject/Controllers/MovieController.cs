
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using RapidApiProject.Models;

namespace RapidApiProject.Controllers
{
    public class MovieController : Controller
    {
        public async Task<IActionResult> MovieList()
        {
            var client = new HttpClient();
            var request = new HttpRequestMessage
            {
                Method = HttpMethod.Get,
                RequestUri = new Uri("https://imdb-top-100-movies.p.rapidapi.com/"),
                Headers =
    {
        { "x-rapidapi-key", "9b2ad97b7dmsh73dc14b9e6ed0e7p1d4084jsnb1752d00f239" },
        { "x-rapidapi-host", "imdb-top-100-movies.p.rapidapi.com" },
    },
            };
            using (var response = await client.SendAsync(request))
            {
                response.EnsureSuccessStatusCode();
                var body = await response.Content.ReadAsStringAsync();
                var val= JsonConvert.DeserializeObject<List<ImdbMovieViewModel>>(body);
                return View(val.ToList());
            }
        }
    }
}
