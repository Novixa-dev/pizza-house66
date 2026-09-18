import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Pizza House Mukalla database...");

  // Clean existing records in correct order
  await prisma.auditLog.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.paymentReceipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItemOption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.optionItem.deleteMany();
  await prisma.optionGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.businessHour.deleteMany();
  await prisma.restaurant.deleteMany();

  // 1. Create Restaurant profile
  const restaurant = await prisma.restaurant.create({
    data: {
      nameAr: "بيتزا هاوس",
      nameEn: "Pizza House",
      slug: "pizza-house-mukalla",
      phone: "05375561",
      whatsapp: "+967772207788",
      addressAr: "المكلا - فوه - حي المساكن - بالقرب من جامعة الأحقاف ومستوصف النور",
      addressEn: "Mukalla, Fuwa, Al-Masaken District, Near Al-Ahgaff University",
      currency: "YER",
      defaultPrepDuration: 15,
      slotCapacityMax: 8,
      isOnlineOrderingPaused: false,
    },
  });

  console.log(`✅ Created Restaurant: ${restaurant.nameAr}`);

  // 2. Business Hours (Saturday - Thursday: 8AM-12PM & 4PM-11:30PM; Friday: 4PM-11:30PM)
  const days = [0, 1, 2, 3, 4, 5, 6]; // Sun(0) to Sat(6)
  for (const day of days) {
    if (day === 5) {
      // Friday: Morning closed, Evening 4PM - 11:30PM
      await prisma.businessHour.create({
        data: {
          restaurantId: restaurant.id,
          dayOfWeek: day,
          shiftName: "Morning",
          openTime: "08:00",
          closeTime: "12:00",
          isClosed: true,
        },
      });
      await prisma.businessHour.create({
        data: {
          restaurantId: restaurant.id,
          dayOfWeek: day,
          shiftName: "Evening",
          openTime: "16:00",
          closeTime: "23:30",
          isClosed: false,
        },
      });
    } else {
      // Sat - Thu: Morning 8AM - 12PM, Evening 4PM - 11:30PM
      await prisma.businessHour.create({
        data: {
          restaurantId: restaurant.id,
          dayOfWeek: day,
          shiftName: "Morning",
          openTime: "08:00",
          closeTime: "12:00",
          isClosed: false,
        },
      });
      await prisma.businessHour.create({
        data: {
          restaurantId: restaurant.id,
          dayOfWeek: day,
          shiftName: "Evening",
          openTime: "16:00",
          closeTime: "23:30",
          isClosed: false,
        },
      });
    }
  }

  console.log("✅ Configured 7-day 2-shift operating hours");

  // 3. Categories
  const catPizza = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      nameAr: "البيتزا الإيطالية",
      nameEn: "Specialty Pizzas",
      slug: "pizzas",
      iconName: "Pizza",
      sortOrder: 1,
    },
  });

  const catFatayer = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      nameAr: "الفطائر والمعجنات",
      nameEn: "Savory Fatayer & Pies",
      slug: "fatayer",
      iconName: "Wheat",
      sortOrder: 2,
    },
  });

  const catSides = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      nameAr: "المقبلات والإضافات",
      nameEn: "Appetizers & Sides",
      slug: "sides",
      iconName: "UtensilsCrossed",
      sortOrder: 3,
    },
  });

  const catDesserts = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      nameAr: "الحلويات",
      nameEn: "Desserts & Sweet Pies",
      slug: "desserts",
      iconName: "Cake",
      sortOrder: 4,
    },
  });

  const catDrinks = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      nameAr: "المشروبات المنعشة",
      nameEn: "Beverages",
      slug: "drinks",
      iconName: "CupSoda",
      sortOrder: 5,
    },
  });

  console.log("✅ Created 5 categories");

  // Helper to add pizza with standard size & crust options
  async function createPizza({
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    basePrice,
    imageUrl,
    isFeatured = false,
    sortOrder = 0,
  }: {
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    basePrice: number;
    imageUrl: string;
    isFeatured?: boolean;
    sortOrder?: number;
  }) {
    const product = await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: catPizza.id,
        nameAr,
        nameEn,
        descriptionAr,
        descriptionEn,
        basePrice,
        imageUrl,
        isFeatured,
        sortOrder,
        optionGroups: {
          create: [
            {
              nameAr: "الحجم",
              nameEn: "Size",
              type: "RADIO",
              isRequired: true,
              minSelect: 1,
              maxSelect: 1,
              options: {
                create: [
                  { nameAr: "صغير (Small - 6 قطع)", nameEn: "Small (6 Slices)", priceDelta: 0 },
                  { nameAr: "وسط (Medium - 8 قطع)", nameEn: "Medium (8 Slices)", priceDelta: 2000 },
                  { nameAr: "كبير (Large - 10 قطع)", nameEn: "Large (10 Slices)", priceDelta: 4000 },
                ],
              },
            },
            {
              nameAr: "نوع العجينة",
              nameEn: "Crust Type",
              type: "RADIO",
              isRequired: true,
              minSelect: 1,
              maxSelect: 1,
              options: {
                create: [
                  { nameAr: "عجينة كلاسيكية هشة", nameEn: "Classic Hand-Tossed", priceDelta: 0 },
                  { nameAr: "عجينة رقيقة ومقرمشة", nameEn: "Thin & Crispy", priceDelta: 0 },
                  { nameAr: "أطراف محشوة بجبنة الموزاريلا", nameEn: "Cheese Stuffed Crust", priceDelta: 1000 },
                ],
              },
            },
            {
              nameAr: "إضافات اختيارية",
              nameEn: "Extra Toppings",
              type: "CHECKBOX",
              isRequired: false,
              minSelect: 0,
              maxSelect: 5,
              options: {
                create: [
                  { nameAr: "موزاريلا إضافية دبل", nameEn: "Double Mozzarella", priceDelta: 500 },
                  { nameAr: "زيتون أسود وأخضر", nameEn: "Sliced Olives", priceDelta: 300 },
                  { nameAr: "فطر طازج (مشروم)", nameEn: "Fresh Mushrooms", priceDelta: 400 },
                  { nameAr: "فلفل هالبينو حار", nameEn: "Jalapenos", priceDelta: 300 },
                  { nameAr: "صوص رانش إضافي على الوجه", nameEn: "Ranch Drizzle", priceDelta: 300 },
                ],
              },
            },
          ],
        },
      },
    });
    return product;
  }

  // 4. Populate Products
  await createPizza({
    nameAr: "بيتزا ببروني كلاسيك",
    nameEn: "Classic Pepperoni Pizza",
    descriptionAr: "شرائح ببروني بقري فاخر مع جبنة موزاريلا ذائبة وصلصة الطماطم الإيطالية الخاصة ببيتزا هاوس على عجينة طازجة.",
    descriptionEn: "Premium beef pepperoni slices over melted mozzarella cheese and signature Italian pizza sauce on fresh dough.",
    basePrice: 4500,
    imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80",
    isFeatured: true,
    sortOrder: 1,
  });

  await createPizza({
    nameAr: "بيتزا هاوس سوبريم الخاصة",
    nameEn: "Pizza House Supreme Special",
    descriptionAr: "مزيج متكامل من قطع اللحم والدجاج والببروني، مع الفلفل الرومي، البصل، الزيتون، والمشروم الطازج بجبنة الموزاريلا الغنية.",
    descriptionEn: "The ultimate house specialty loaded with beef, seasoned chicken, pepperoni, bell peppers, onions, olives, and mushrooms.",
    basePrice: 5500,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    isFeatured: true,
    sortOrder: 2,
  });

  await createPizza({
    nameAr: "بيتزا دجاج رانش",
    nameEn: "Chicken Ranch Pizza",
    descriptionAr: "قطع صدور دجاج مشوية بتتبيلتنا الخاصة، صوص الرانش الغني، فطر طازج، وجبنة موزاريلا تعلوها رشة أوريجانو عطرة.",
    descriptionEn: "Tender grilled chicken breast cubes with creamy ranch sauce, fresh sliced mushrooms, and loaded mozzarella.",
    basePrice: 5000,
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    isFeatured: true,
    sortOrder: 3,
  });

  await createPizza({
    nameAr: "بيتزا دجاج باربكيو",
    nameEn: "BBQ Chicken Pizza",
    descriptionAr: "دجاج متبل بصلصة الباربكيو المدخنة اللذيذة مع شرائح البصل الأحمر وجبنة الموزاريلا وصوص البيتزا الذهبي.",
    descriptionEn: "Smoky BBQ glazed chicken with red onion slices, mozzarella cheese, and our golden signature crust.",
    basePrice: 4800,
    imageUrl: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&q=80",
    isFeatured: false,
    sortOrder: 4,
  });

  await createPizza({
    nameAr: "بيتزا مارجريتا الأصلية",
    nameEn: "Traditional Margherita",
    descriptionAr: "البساطة الإيطالية الفاخرة: صلصة طماطم متبلة بالأعشاب الطازجة، طبقة وفيرة من جبنة الموزاريلا الفاخرة، وزيت الزيتون البكر.",
    descriptionEn: "Classic Italian simplicity with herb-infused marinara sauce, generous melted mozzarella, and extra virgin olive oil.",
    basePrice: 3500,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80",
    isFeatured: false,
    sortOrder: 5,
  });

  await createPizza({
    nameAr: "بيتزا خضار مشكل (فيجي)",
    nameEn: "Vegetarian Garden Pizza",
    descriptionAr: "تشكيلة غنية من الخضار الطازجة: فلفل حلو ملون، بصل مقرمش، طماطم، زيتون، مشروم، مع صلصة الطماطم وجبنة الموزاريلا.",
    descriptionEn: "A vibrant garden medley of crisp bell peppers, red onions, diced tomatoes, black olives, and fresh mushrooms.",
    basePrice: 4000,
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
    isFeatured: false,
    sortOrder: 6,
  });

  // Fatayer
  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catFatayer.id,
      nameAr: "فطيرة جبن كرافت بالعسل",
      nameEn: "Kraft Cheese & Honey Pie",
      descriptionAr: "فطيرة ساخنة ومحشوة بجبنة كرافت الأصلية الغنية ومغطاة بأجود أنواع العسل الصافي.",
      descriptionEn: "Warm golden pastry generously filled with savory melted Kraft cheese and drizzled with pure golden honey.",
      basePrice: 2000,
      imageUrl: "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=800&q=80",
      isFeatured: true,
      sortOrder: 1,
      optionGroups: {
        create: [
          {
            nameAr: "الحجم",
            nameEn: "Size",
            type: "RADIO",
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            options: {
              create: [
                { nameAr: "عادي", nameEn: "Regular", priceDelta: 0 },
                { nameAr: "كبير دبل", nameEn: "Large Double", priceDelta: 1000 },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catFatayer.id,
      nameAr: "فطيرة لحم مفروم بالبهارات",
      nameEn: "Spiced Minced Meat Fatayer",
      descriptionAr: "عجينة رقيقة ومحشوة باللحم المفروم الطازج المتبل بالبصل والبهارات الشرقية المميزة.",
      descriptionEn: "Delicate dough packed with freshly spiced minced beef, minced onions, and aromatic oriental herbs.",
      basePrice: 2200,
      imageUrl: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&q=80",
      isFeatured: false,
      sortOrder: 2,
    },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catFatayer.id,
      nameAr: "فطيرة لبنة وزعتر بلدي",
      nameEn: "Labneh & Wild Za'atar Pie",
      descriptionAr: "لبنة كريمية تركية مع خلطة الزعتر البري وزيت الزيتون على عجينة مخبوزة على الحجر.",
      descriptionEn: "Smooth cream labneh paired with fragrant wild za'atar herbs and extra virgin olive oil.",
      basePrice: 1800,
      imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80",
      isFeatured: false,
      sortOrder: 3,
    },
  });

  // Sides
  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catSides.id,
      nameAr: "خبز بالثوم وجبنة الموزاريلا",
      nameEn: "Cheesy Garlic Bread",
      descriptionAr: "قطع خبز فرنسي مقرمش مدهونة بزبدة الثوم والأعشاب ومغطاة بجبنة الموزاريلا الساخنة الذائبة.",
      descriptionEn: "Crispy artisan baguette slices brushed with garlic herb butter and smothered in bubbling melted mozzarella.",
      basePrice: 1800,
      imageUrl: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800&q=80",
      isFeatured: true,
      sortOrder: 1,
    },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catSides.id,
      nameAr: "بطاطس ودجز متبلة بالأعشاب",
      nameEn: "Herbed Potato Wedges",
      descriptionAr: "أصابع بطاطس ودجز مقرمشة ومتبلة بخلطة البابريكا والأعشاب الإيطالية مع صوص الكاتشب أو المايونيز.",
      descriptionEn: "Crispy, fluffy golden seasoned potato wedges dusted with smoked paprika and Italian herbs.",
      basePrice: 1500,
      imageUrl: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&q=80",
      isFeatured: false,
      sortOrder: 2,
    },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catSides.id,
      nameAr: "أصابع جبنة الموزاريلا المقلية (5 قطع)",
      nameEn: "Fried Mozzarella Sticks (5 pcs)",
      descriptionAr: "أصابع الموزاريلا الذهبية المقرمشة تقدم مع صوص المارينارا اللذيذ للتغميس.",
      descriptionEn: "Five golden-fried mozzarella batons with irresistible cheese pull, served with zesty marinara sauce.",
      basePrice: 2200,
      imageUrl: "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=800&q=80",
      isFeatured: false,
      sortOrder: 3,
    },
  });

  // Desserts
  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catDesserts.id,
      nameAr: "فطيرة النوتيلا والموز الدافئة",
      nameEn: "Warm Nutella & Banana Pie",
      descriptionAr: "عجينة بيتزا طازجة ومحشوة بشوكولاتة النوتيلا الغنية مع شرائح الموز والمكسرات المحمصة.",
      descriptionEn: "Decadent dessert pastry smothered in rich Nutella hazelnut chocolate and fresh banana slices.",
      basePrice: 2500,
      imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80",
      isFeatured: true,
      sortOrder: 1,
    },
  });

  // Drinks
  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catDrinks.id,
      nameAr: "بيبسي بارد (علبة 330 مل)",
      nameEn: "Pepsi Can (330ml)",
      descriptionAr: "مشروب بيبسي غازي منعش ومثلج.",
      descriptionEn: "Ice-cold refreshing can of Pepsi.",
      basePrice: 700,
      imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&q=80",
      sortOrder: 1,
    },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catDrinks.id,
      nameAr: "سفن آب بارد (علبة 330 مل)",
      nameEn: "7Up Can (330ml)",
      descriptionAr: "مشروب سفن آب ليمون منعش ومثلج.",
      descriptionEn: "Ice-cold refreshing can of 7Up.",
      basePrice: 700,
      imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
      sortOrder: 2,
    },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catDrinks.id,
      nameAr: "مياه شرب نقية (500 مل)",
      nameEn: "Mineral Water (500ml)",
      descriptionAr: "مياه شرب معبأة نقية ومنعشة.",
      descriptionEn: "Pure bottled mineral water.",
      basePrice: 400,
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&q=80",
      sortOrder: 3,
    },
  });

  console.log("✅ Seeded full menu items and options!");

  // 5. Create 3 sample orders representing different realistic stages:
  // Order 1: Scheduled order for later this evening (QUEUED)
  const now = new Date();
  const laterToday = new Date(now.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hrs later
  const prepStart = new Date(laterToday.getTime() - 20 * 60 * 1000); // 20 min before pickup

  const sampleOrder1 = await prisma.order.create({
    data: {
      orderNumber: "#PH-1024",
      restaurantId: restaurant.id,
      customerName: "سالم بن محفوظ",
      customerPhone: "771234567",
      pickupMode: "SCHEDULED",
      requestedPickupTime: laterToday,
      plannedPrepStartTime: prepStart,
      status: "QUEUED",
      subtotal: 9500,
      discount: 0,
      total: 9500,
      notes: "يرجى تحمير البيتزا جيداً",
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({ where: { nameEn: "Classic Pepperoni Pizza" } }))!.id,
            productNameAr: "بيتزا ببروني كلاسيك",
            productNameEn: "Classic Pepperoni Pizza",
            unitPrice: 4500,
            quantity: 1,
            subtotal: 9500,
            options: {
              create: [
                { groupNameAr: "الحجم", groupNameEn: "Size", nameAr: "كبير (Large - 10 قطع)", nameEn: "Large (10 Slices)", priceDelta: 4000 },
                { groupNameAr: "نوع العجينة", groupNameEn: "Crust Type", nameAr: "أطراف محشوة بجبنة الموزاريلا", nameEn: "Cheese Stuffed Crust", priceDelta: 1000 },
              ],
            },
          },
        ],
      },
      payment: {
        create: {
          method: "TRANSFER_KURAIMI",
          status: "VERIFIED",
          amount: 9500,
          referenceNumber: "KM-849201",
          verifiedAt: now,
          verifiedBy: "الكاشير",
        },
      },
    },
  });

  // Order 2: In oven right now (PREPARING)
  const inOvenPickup = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins from now
  await prisma.order.create({
    data: {
      orderNumber: "#PH-1025",
      restaurantId: restaurant.id,
      customerName: "عمر باحميد",
      customerPhone: "733445566",
      pickupMode: "ASAP",
      requestedPickupTime: inOvenPickup,
      plannedPrepStartTime: now,
      actualPrepStartTime: now,
      status: "PREPARING",
      subtotal: 7000,
      discount: 0,
      total: 7000,
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({ where: { nameEn: "Chicken Ranch Pizza" } }))!.id,
            productNameAr: "بيتزا دجاج رانش",
            productNameEn: "Chicken Ranch Pizza",
            unitPrice: 5000,
            quantity: 1,
            subtotal: 7000,
            options: {
              create: [
                { groupNameAr: "الحجم", groupNameEn: "Size", nameAr: "وسط (Medium - 8 قطع)", nameEn: "Medium (8 Slices)", priceDelta: 2000 },
              ],
            },
          },
        ],
      },
      payment: {
        create: {
          method: "PAY_AT_PICKUP",
          status: "UNPAID",
          amount: 7000,
        },
      },
    },
  });

  // Order 3: Pending verification (PAYMENT_PENDING) with uploaded receipt
  await prisma.order.create({
    data: {
      orderNumber: "#PH-1026",
      restaurantId: restaurant.id,
      customerName: "محمد العمودي",
      customerPhone: "777889900",
      pickupMode: "SCHEDULED",
      requestedPickupTime: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
      plannedPrepStartTime: new Date(now.getTime() + 1.2 * 60 * 60 * 1000),
      status: "PAYMENT_PENDING",
      subtotal: 6000,
      discount: 0,
      total: 6000,
      notes: "بدون بصل لو سمحتم",
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({ where: { nameEn: "Traditional Margherita" } }))!.id,
            productNameAr: "بيتزا مارجريتا الأصلية",
            productNameEn: "Traditional Margherita",
            unitPrice: 3500,
            quantity: 1,
            subtotal: 5500,
            options: {
              create: [
                { groupNameAr: "الحجم", groupNameEn: "Size", nameAr: "وسط (Medium - 8 قطع)", nameEn: "Medium (8 Slices)", priceDelta: 2000 },
              ],
            },
          },
        ],
      },
      payment: {
        create: {
          method: "TRANSFER_BUSAIRI",
          status: "PENDING_VERIFICATION",
          amount: 6000,
          referenceNumber: "BS-110293",
          receipt: {
            create: {
              fileUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
              fileName: "receipt_sample.jpg",
              mimeType: "image/jpeg",
              fileSize: 245000,
            },
          },
        },
      },
    },
  });

  console.log("✅ Seeded 3 sample operational orders!");
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
