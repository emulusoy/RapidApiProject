using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace RapidApiProject.Entities
{
    public class TrainingDay
    {
        [Key] public int Id { get; set; }

        [ForeignKey(nameof(Program))]
        public int ProgramId { get; set; }
        public TrainingProgram Program { get; set; } = default!;

        // Kişisel planda kullan (Pzt..Paz tekil tarih)
        [Column(TypeName = "date")]
        public DateTime? DayDate { get; set; }

        // Şablonlarda kullan (1=Mon .. 7=Sun)
        public byte? DayOfWeek { get; set; }

        [MaxLength(80)]
        public string? Title { get; set; }

        public ICollection<TrainingItem> Items { get; set; } = new List<TrainingItem>();
    }
}
