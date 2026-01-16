/**
 * Seed Script - Add sample news articles
 */

const { initializeDatabase, db } = require('./models/database');

const sampleNews = [
    {
        title: 'افتتاح التسجيلات للعام الجامعي 2024-2025',
        content: 'يسر اتحاد الطلبة الموريتانيين بالجزائر أن يعلن عن افتتاح التسجيلات للعام الجامعي الجديد 2024-2025. يمكن للطلبة الجدد التسجيل عبر منصة PROGRES الإلكترونية. الموعد النهائي للتسجيل هو 30 سبتمبر 2024. للمزيد من المعلومات، يرجى التواصل مع الاتحاد.',
        category: 'announcement',
        location: 'الجزائر العاصمة',
        published: 1
    },
    {
        title: 'لقاء تعارفي للطلبة الجدد',
        content: 'ينظم اتحاد الطلبة الموريتانيين لقاءً تعارفياً للطلبة الجدد يوم السبت القادم. سيتضمن اللقاء جلسة توجيهية حول الحياة الجامعية في الجزائر، ونصائح للتأقلم مع البيئة الجديدة. سيكون هناك أيضاً فرصة للتعرف على الطلبة القدامى والاستفادة من تجاربهم.',
        category: 'event',
        location: 'قاعة المحاضرات - جامعة الجزائر',
        published: 1
    },
    {
        title: 'نجاح باهر للطلبة الموريتانيين في الامتحانات',
        content: 'نثمن ونهنئ جميع الطلبة الموريتانيين الذين حققوا نتائج متميزة في امتحانات الفصل الأول. حقق طلبتنا معدلات نجاح عالية في مختلف التخصصات، وخاصة في كليات الطب والهندسة والعلوم. نتمنى لهم المزيد من التفوق والنجاح.',
        category: 'news',
        location: null,
        published: 1
    },
    {
        title: 'ورشة عمل: كيفية كتابة السيرة الذاتية',
        content: 'ينظم الاتحاد ورشة عمل حول كتابة السيرة الذاتية والتحضير لمقابلات العمل. ستقدم الورشة نصائح عملية لإعداد سيرة ذاتية احترافية، وكيفية التميز في سوق العمل. الورشة مفتوحة لجميع الأعضاء.',
        category: 'event',
        location: 'مقر الاتحاد',
        published: 1
    },
    {
        title: 'تحديث: إجراءات تجديد الإقامة',
        content: 'نود إبلاغ الطلبة بالإجراءات الجديدة لتجديد الإقامة. يجب تقديم الطلب قبل شهر من انتهاء صلاحية الإقامة الحالية. الوثائق المطلوبة: جواز السفر، شهادة التسجيل، إيصال الإقامة الجامعية، وصورتان شمسيتان. للمساعدة، تواصلوا مع مكتب الاتحاد.',
        category: 'announcement',
        location: null,
        published: 1
    },
    {
        title: 'احتفالية عيد الاستقلال الموريتاني',
        content: 'بمناسبة الذكرى السنوية لاستقلال موريتانيا، ينظم الاتحاد احتفالية خاصة تتضمن فقرات ثقافية وفنية متنوعة. ندعو جميع أبناء الجالية للمشاركة في هذه المناسبة الوطنية الغالية. سيكون هناك عشاء جماعي بعد الاحتفال.',
        category: 'event',
        location: 'قاعة الاحتفالات الكبرى',
        published: 1
    }
];

async function seedNews() {
    try {
        console.log('Initializing database...');
        await initializeDatabase();

        console.log('\nAdding sample news articles...\n');

        sampleNews.forEach((news, index) => {
            db.run(
                'INSERT INTO news (title, content, category, location, published) VALUES (?, ?, ?, ?, ?)',
                [news.title, news.content, news.category, news.location, news.published]
            );
            console.log(`${index + 1}. ${news.title.substring(0, 50)}...`);
        });

        console.log(`\nDone! Added ${sampleNews.length} news articles.`);
        console.log('\nYou can view them at:');
        console.log('- Website: http://localhost:3000/news');
        console.log('- Admin: http://localhost:3000/admin/news.html');

    } catch (error) {
        console.error('Error seeding news:', error);
    }
}

seedNews();
