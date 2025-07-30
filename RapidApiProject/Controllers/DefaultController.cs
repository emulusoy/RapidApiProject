using Microsoft.AspNetCore.Mvc;
using RapidApiProject.Context;
using RapidApiProject.Entities;
using RapidApiProject.Models;

namespace RapidApiProject.Controllers
{
    public class DefaultController : Controller
    {
        private readonly ListContext _context;

        public DefaultController(ListContext context)
        {
            _context = context;
        }

        public IActionResult Dashboard()
        {
            var values = _context.Notes.ToList();
            return View(values);
        }
        [HttpPost] 
        public IActionResult DeleteNote([FromBody] int noteId) 
        {

            var noteToRemove = _context.Notes.FirstOrDefault(n => n.NoteID == noteId);

            if (noteToRemove == null)
            {
                // Not bulunamadıysa 404 Not Found döndür
                return NotFound(new { success = false, message = "Not bulunamadı." });
            }

            _context.Remove(noteToRemove);
            _context.SaveChanges(); 

            return Ok(new { success = true, message = "Not başarıyla silindi." });
        }
    }
}
