using RapidApiProject.Models;

namespace RapidApiProject.Entities
{
    public class ExerciseCategory
    {
        public int Id { get; set; }
        public string Slug { get; set; } = "";  
        public string Name { get; set; } = ""; 
        public string? Icon { get; set; }       
        public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    }
}
