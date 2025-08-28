using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace RapidApiProject.Entities
{
    public class TrainingProgram
    {
        [Key] public int Id { get; set; }

        [Required, MaxLength(120)]
        public string Title { get; set; } = "";

        [MaxLength(100)]
        public string? UserId { get; set; }

        [Column(TypeName = "date")]
        public DateTime StartDate { get; set; }

        [Column(TypeName = "date")]
        public DateTime EndDate { get; set; }

        public bool IsTemplate { get; set; } = false;

        public DateTime CreatedAt { get; set; } 

        public ICollection<TrainingDay> Days { get; set; } = new List<TrainingDay>();
    }
}
