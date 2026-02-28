import { Logger } from '@nestjs/common';
import { CatalogItem } from 'src/products/entities/catalog-item.entity';
import { DataSource } from 'typeorm';

export async function seedCatalog(dataSource: DataSource) {
  const logger = new Logger('CatalogSeeder');
  const catalogRepo = dataSource.getRepository(CatalogItem);
  try {
    const catalogData: Partial<CatalogItem>[] = [
      //  ألبان و بيض (Dairy & Eggs)
      {
        name: 'بيض أبيض',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/white-egg.png',
      },
      {
        name: 'بيض أحمر',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/red-egg.png',
      },
      {
        name: 'بيض بلدي',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/white-egg.png',
      },
      {
        name: 'لبن كامل الدسم',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/milk.png',
      },
      {
        name: 'لبن خالي الدسم',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/milk.png',
      },
      {
        name: 'لبن رايب',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/rayeb.png',
      },
      {
        name: 'لبن بودرة',
        category: 'ألبان و بيض',
        // image_url: '/catalog-items-img/milk.png',
      },
      {
        name: 'زبادي سادة',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/yogurt.png',
      },
      {
        name: 'زبادي فواكه',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/yogurt.png',
      },
      {
        name: 'جبنة فيتا',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/white-cheese.png',
      },
      {
        name: 'جبنة رومي',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/cheese.png',
      },
      {
        name: 'جبنة شيدر',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/cheese.png',
      },
      {
        name: 'جبنة قريش',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/white-cheese.png',
      },
      {
        name: 'جبنة اسطنبولي',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/white-cheese.png',
      },
      {
        name: 'جبنة بيضاء',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/white-cheese.png',
      },
      {
        name: 'جبنة براميلي',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/white-cheese.png',
      },
      {
        name: 'جبنة موتزاريلا',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/mozzarella.png',
      },
      {
        name: 'جبنة فلمنك',
        category: 'ألبان و بيض',
        image_url: '/catalog-items-img/cheese.png',
      },
      {
        name: 'قشطة بلدي',
        category: 'ألبان و بيض',
        // image_url: '/catalog-items-img/white-cheese.png'
      },

      // صلصات و خل (Sauces & Vinegar)
      {
        name: 'طحينة',
        category: 'صلصات و خل',
        image_url: '/catalog-items-img/tehina.png',
      },
      {
        name: 'صلصة طماطم',
        category: 'صلصات و خل',
        image_url: '/catalog-items-img/tomato-sauce.png',
      },
      {
        name: 'كاتشب',
        category: 'صلصات و خل',
        image_url: '/catalog-items-img/ketchup.png',
      },
      {
        name: 'مايونيز',
        category: 'صلصات و خل',
        // image_url: '/catalog-items-img/mayonnaise.png',
      },
      {
        name: 'مستردة',
        category: 'صلصات و خل',
        image_url: '/catalog-items-img/mustard.png',
      },
      {
        name: 'خل أبيض',
        category: 'صلصات و خل',
        image_url: '/catalog-items-img/white-vinegar.png',
      },
      {
        name: 'خل تفاح',
        category: 'صلصات و خل',
        image_url: '/catalog-items-img/apple-vinegar.png',
      },
      {
        name: 'دبس رمان',
        category: 'صلصات و خل',
        image_url: '/catalog-items-img/pomegranate-molasses.png',
      },

      // مخبوزات (Bakeries)
      {
        name: 'عيش بلدي',
        category: 'مخبوزات',
        image_url: '/catalog-items-img/bread.png',
      },
      {
        name: 'عيش فينو',
        category: 'مخبوزات',
        image_url: '/catalog-items-img/fino.png',
      },
      {
        name: 'عيش شامي',
        category: 'مخبوزات',
        image_url: '/catalog-items-img/shami.png',
      },
      {
        name: 'عيش توست أبيض',
        category: 'مخبوزات',
        image_url: '/catalog-items-img/white-toast.png',
      },
      {
        name: 'عيش توست أسمر',
        category: 'مخبوزات',
        image_url: '/catalog-items-img/brown-toast.png',
      },
      {
        name: 'بقسماط',
        category: 'مخبوزات',
        image_url: '/catalog-items-img/rusk.png',
      },
      {
        name: 'باتيه',
        category: 'مخبوزات',
        image_url: '/catalog-items-img/pastry.png',
      },

      // عسل ومربى وشوكولاتة (Honey, Jam & Chocolate)
      {
        name: 'عسل نحل',
        category: 'عسل ومربى وشوكولاتة',
        image_url: '/catalog-items-img/honey.png',
      },
      {
        name: 'مربى مشمش',
        category: 'عسل ومربى وشوكولاتة',
        image_url: '/catalog-items-img/jam.png',
      },
      {
        name: 'مربى فراولة',
        category: 'عسل ومربى وشوكولاتة',
        image_url: '/catalog-items-img/jam.png',
      },
      {
        name: 'مربى تين',
        category: 'عسل ومربى وشوكولاتة',
        image_url: '/catalog-items-img/jam.png',
      },
      {
        name: 'مربى توت',
        category: 'عسل ومربى وشوكولاتة',
        image_url: '/catalog-items-img/jam.png',
      },
      {
        name: 'شوكولاتة طبخ',
        category: 'عسل ومربى وشوكولاتة',
        image_url: '/catalog-items-img/chocolate.png',
      },

      // زيت وسمن (Oil & Ghee)
      {
        name: 'زيت عباد الشمس',
        category: 'زيت وسمن',
        image_url: '/catalog-items-img/oil.png',
      },
      {
        name: 'زيت ذرة',
        category: 'زيت وسمن',
        image_url: '/catalog-items-img/oil.png',
      },
      {
        name: 'زيت زيتون',
        category: 'زيت وسمن',
        image_url: '/catalog-items-img/olive-oil.png',
      },
      {
        name: 'سمن بلدي',
        category: 'زيت وسمن',
        image_url: '/catalog-items-img/ghee.png',
      },
      {
        name: 'سمن نباتي',
        category: 'زيت وسمن',
        image_url: '/catalog-items-img/ghee.png',
      },

      // بقوليات (Legumes)
      {
        name: 'فول تدميس',
        category: 'بقوليات',
        image_url: '/catalog-items-img/peas.png',
      },
      {
        name: 'عدس أصفر',
        category: 'بقوليات',
        // image_url: '/catalog-items-img/peas.png',
      },
      {
        name: 'عدس بجبة',
        category: 'بقوليات',
        // image_url: '/catalog-items-img/peas.png',
      },
      {
        name: 'فاصوليا بيضاء',
        category: 'بقوليات',
        // image_url: '/catalog-items-img/peas.png',
      },
      {
        name: 'لوبيا',
        category: 'بقوليات',
        // image_url: '/catalog-items-img/peas.png',
      },
      {
        name: 'حمص شام',
        category: 'بقوليات',
        // image_url: '/catalog-items-img/peas.png',
      },

      // أرز ومكرونة (Rice & Pasta)
      {
        name: 'أرز أبيض',
        category: 'أرز ومكرونة',
        image_url: '/catalog-items-img/rice.png',
      },
      {
        name: 'أرز بسمتي',
        category: 'أرز ومكرونة',
        image_url: '/catalog-items-img/basmati.png',
      },
      {
        name: 'مكرونة قلم',
        category: 'أرز ومكرونة',
        image_url: '/catalog-items-img/pasta.png',
      },
      {
        name: 'مكرونة اسباجيتي',
        category: 'أرز ومكرونة',
        image_url: '/catalog-items-img/pasta.png',
      },
      {
        name: 'مكرونة خواتم/مرمرية',
        category: 'أرز ومكرونة',
        image_url: '/catalog-items-img/pasta.png',
      },
      {
        name: 'شعرية',
        category: 'أرز ومكرونة',
        // image_url: '/catalog-items-img/rice.png'
      },
      {
        name: 'لسان عصفور',
        category: 'أرز ومكرونة',
        // image_url: '/catalog-items-img/rice.png'
      },

      // سكر وملح وتوابل (Sugar & Salt)
      {
        name: 'سكر',
        category: 'سكر وملح وتوابل',
        image_url: '/catalog-items-img/sugar.png',
      },
      {
        name: 'ملح',
        category: 'سكر وملح وتوابل',
        image_url: '/catalog-items-img/salt.png',
      },
      {
        name: 'فلفل أسود',
        category: 'سكر وملح وتوابل',
        // image_url: '/catalog-items-img/salt.png'
      },
      {
        name: 'كمون',
        category: 'سكر وملح وتوابل',
        // image_url: '/catalog-items-img/salt.png'
      },
      {
        name: 'بهارات مشكلة',
        category: 'سكر وملح وتوابل',
        // image_url: '/catalog-items-img/salt.png'
      },

      // معلبات (Canned Foods)
      {
        name: 'تونة قطعة واحدة',
        category: 'معلبات',
        image_url: '/catalog-items-img/tuna.png',
      },
      {
        name: 'تونة قطع',
        category: 'معلبات',
        image_url: '/catalog-items-img/tuna.png',
      },
      {
        name: 'تونة مفتتة',
        category: 'معلبات',
        image_url: '/catalog-items-img/tuna.png',
      },
      {
        name: 'صلصة طماطم (برطمان)',
        category: 'معلبات',
        image_url: '/catalog-items-img/tomato-sauce.png',
      },
      {
        name: 'فول مدمس معلب',
        category: 'معلبات',
        image_url: '/catalog-items-img/peas.png',
      },
      {
        name: 'مشروم مقطع معلب',
        category: 'معلبات',
        image_url: '/catalog-items-img/mushroom.png',
      },
      {
        name: 'ذرة حلوة معلب',
        category: 'معلبات',
        image_url: '/catalog-items-img/sweet-corn.png',
      },

      // مشروبات (Beverages)
      {
        name: 'شاي ناعم (خرز)',
        category: 'مشروبات',
        image_url: '/catalog-items-img/tea.png',
      },
      {
        name: 'شاي فتلة',
        category: 'مشروبات',
        image_url: '/catalog-items-img/tea-bag.png',
      },
      {
        name: 'قهوة (بن فاتح/وسط)',
        category: 'مشروبات',
        image_url: '/catalog-items-img/coffee.png',
      },
      {
        name: 'نسكافيه بلاك',
        category: 'مشروبات',
        image_url: '/catalog-items-img/nescafe.png',
      },
      {
        name: 'مشروب كاكاو بودرة',
        category: 'مشروبات',
        image_url: '/catalog-items-img/cacao.png',
      },
      {
        name: 'مياه معدنية (كبيرة/صغيرة)',
        category: 'مشروبات',
        image_url: '/catalog-items-img/water.png',
      },
      {
        name: 'مياه غازية',
        category: 'مشروبات',
        image_url: '/catalog-items-img/soda-bottle.png',
      },
      {
        name: 'مياه غازية (كانز)',
        category: 'مشروبات',
        image_url: '/catalog-items-img/soda-cans.png',
      },
      {
        name: 'عصائر طبيعية (كرتون)',
        category: 'مشروبات',
        image_url: '/catalog-items-img/juice.png',
      },

      // فاكهة (Fruit)
      { name: 'تفاح', category: 'فاكهة' },
      { name: 'موز', category: 'فاكهة' },
      { name: 'برتقال', category: 'فاكهة' },

      // خضار (Vegetable)
      { name: 'طماطم', category: 'خضار' },
      { name: 'خيار', category: 'خضار' },
      { name: 'بطاطس', category: 'خضار' },
      { name: 'بصل', category: 'خضار' },

      // خضار مجمد (Frozen Vegetables)
      {
        name: 'بسلة مجمدة',
        category: 'خضار مجمد',
        image_url: '/catalog-items-img/frozen-vegetables.png',
      },
      {
        name: 'بامية مجمدة',
        category: 'خضار مجمد',
        image_url: '/catalog-items-img/frozen-vegetables.png',
      },
      {
        name: 'ملوخية مجمدة',
        category: 'خضار مجمد',
        image_url: '/catalog-items-img/frozen-vegetables.png',
      },
      {
        name: 'خضار مشكل مجمد',
        category: 'خضار مجمد',
        image_url: '/catalog-items-img/frozen-vegetables.png',
      },
      {
        name: 'بطاطس مجمدة',
        category: 'خضار مجمد',
        image_url: '/catalog-items-img/fried-potatos.png',
      },
      {
        name: 'بطاطس مقلية مجمدة',
        category: 'خضار مجمد',
        image_url: '/catalog-items-img/fried-potatos.png',
      },

      // لحوم و دواجن (Meat & Poultry)
      {
        name: 'فراخ بيضاء',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/chicken.png',
      },
      {
        name: 'فراخ مجمدة',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/chicken.png',
      },
      {
        name: 'بانيه',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/chicken.png',
      },
      // { name: 'شاورمة فراخ', category: 'لحوم و دواجن', image_url: '/catalog-items-img/chicken.png' },
      // { name: 'كبدة فراخ', category: 'لحوم و دواجن', image_url: '/catalog-items-img/chicken.png' },
      {
        name: 'سجق',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/sausage.png',
      },
      {
        name: 'برجر',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/burger.png',
      },
      {
        name: 'لحمة مفرومة',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/minced-meat.png',
      },
      {
        name: 'لحمة مستوردة',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/meat.png',
      },
      // { name: 'فراخ بلدي', category: 'لحوم و دواجن', image_url: '/catalog-items-img/chicken.png' },
      {
        name: 'صدور فراخ',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/chicken-breasts.png',
      },
      {
        name: 'وراك فراخ',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/chicken-thighs.png',
      },
      {
        name: 'لحمة بلدي',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/meat.png',
      },
      {
        name: 'كفتة',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/kufta.png',
      },
      {
        name: 'فراخ كاملة مبردة',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/chicken.png',
      },
      {
        name: 'صدور فراخ بانيه',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/chicken-breasts.png',
      },
      {
        name: 'مكعبات لحم كندوز',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/meat.png',
      },
      {
        name: 'كفتة داوود باشا (مجمدة)',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/kufta-dawood-pasha.png',
      },
      {
        name: 'سجق شرقي',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/sausage.png',
      },
      {
        name: 'لانشون (بقري/فراخ)',
        category: 'لحوم و دواجن',
        image_url: '/catalog-items-img/lanshon-meat.png',
      },

      // سناكس و حلويات (Snacks & Sweets)
      {
        name: 'شيبسي',
        category: 'سناكس و حلويات',
        image_url: '/catalog-items-img/chips.png',
      },
      {
        name: 'بسكويت شاي',
        category: 'سناكس و حلويات',
        image_url: '/catalog-items-img/tea-biscuit.png',
      },
      {
        name: 'ويفر',
        category: 'سناكس و حلويات',
        image_url: '/catalog-items-img/wafer.png',
      },
      {
        name: 'شيكولاتة',
        category: 'سناكس و حلويات',
        image_url: '/catalog-items-img/chocolate.png',
      },
      {
        name: 'بسكويت سادة/بالعجوة',
        category: 'سناكس و حلويات',
        //  image_url: '/catalog-items-img/chips.png'
      },
      {
        name: 'لب ومكسرات مشكلة',
        category: 'سناكس و حلويات',
        // image_url: '/catalog-items-img/chips.png'
      },
      { name: 'حلاوة طحينية', category: 'سناكس و حلويات' },

      // منظفات ومنتجات ورقية (Cleaning & Paper)
      {
        name: 'مسحوق غسيل أوتوماتيك',
        category: 'منظفات ومنتجات ورقية',
        image_url: '/catalog-items-img/omo.png',
      },
      {
        name: 'سائل غسيل أطباق',
        category: 'منظفات ومنتجات ورقية',
        image_url: '/catalog-items-img/pril.png',
      },
      {
        name: 'كلور مطهر',
        category: 'منظفات ومنتجات ورقية',
        image_url: '/catalog-items-img/clorox.png',
      },
      {
        name: 'مناديل سحب (باكت)',
        category: 'منظفات ومنتجات ورقية',
        image_url: '/catalog-items-img/pull-out-tissues.png',
      },
      {
        name: 'مناديل تواليت',
        category: 'منظفات ومنتجات ورقية',
        image_url: '/catalog-items-img/toilet-paper.png',
      },
      {
        name: 'صابون يد',
        category: 'منظفات ومنتجات ورقية',
        image_url: '/catalog-items-img/hand-soap.png',
      },
      {
        name: 'صابون غسيل',
        category: 'منظفات ومنتجات ورقية',
        image_url: '/catalog-items-img/laundry-soap.png',
      },
    ];

    for (const item of catalogData) {
      const exists = await catalogRepo.findOne({
        where: { name: item.name, category: item.category },
      });
      if (!exists) {
        await catalogRepo.save(
          catalogRepo.create({ ...item, is_active: true }),
        );
      }
    }

    logger.log('Seeding completed successfully.');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
}
