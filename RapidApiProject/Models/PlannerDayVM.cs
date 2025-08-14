namespace RapidApiProject.Models
{
    public class PlannerDayVM
    {
        public int DayId { get; set; }
        public DateTime Date { get; set; }
        public string Title { get; set; } = "";
        public List<PlannerItemVM> Items { get; set; } = new();
    }
}
