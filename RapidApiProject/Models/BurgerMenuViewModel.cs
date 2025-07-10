namespace RapidApiProject.Models
{
    public class BurgerMenuViewModel
    {

            public string name { get; set; }
            public Image[] images { get; set; }
            public string desc { get; set; }
            public float price { get; set; }
        

            public class Image
            {
                public string sm { get; set; }
                public string lg { get; set; }
            }



    }
}
