namespace RapidApiProject.Entities
{
    public class Exercise
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public int CategoryId { get; set; }
        public ExerciseCategory Category { get; set; } = default!;
        public string Mechanics { get; set; } = "Compound"; 
        public string Difficulty { get; set; } = "Beginner"; 
        public string Equipment { get; set; } = "Bodyweight"; 

        public string? Image { get; set; }    
        public string? VideoUrl { get; set; } 
        public string? Notes { get; set; }
        public string? PrimaryMuscles { get; set; }  
        public string? SecondaryMuscles { get; set; } 
        public bool IsFavorite { get; set; }
    }
}
