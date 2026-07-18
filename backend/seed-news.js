/**
 * Seed Script - Add sample news articles
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { initializeDatabase, getClient } = require('./models/database');

const sampleNews = [
    {
        title: 'افتتاح التسجيلات للعام الجامعي 2024-2025',
        content: 'يسر اتحاد الطلبة الموريتانيين بالجزائر أن يعلن عن افتتاح التسجيلات للعام الجامعي الجديد 2024-2025. يمكن للطلبة الجدد التسجيل عبر منصة PROGRES الإلكترونية. الموعد النهائي للتسجيل هو 30 سبتمبر 2024. للمزيد من المعلومات، يرجى التواصل مع الاتحاد.',
        category: 'announcement',
        location: 'الجزائر العاصمة',
        published: true
    },
    {
        title: 'لقاء تعارفي للطلبة الجدد',
        content: 'ينظم اتحاد الطلبة الموريتانيين لقاءً تعارفياً للطلبة الجدد يوم السبت القادم. سيتضمن اللقاء جلسة توجيهية حول الحياة الجامعية في الجزائر، ونصائح للتأقلم مع البيئة الجديدة. سيكون هناك أيضاً فرصة للتعرف على الطلبة القدامى والاستفادة من تجاربهم.',
        category: 'event',
        location: 'قاعة المحاضرات - جامعة الجزائر',
        published: true
    },
    {
        title: 'نجاح باهر للطلبة الموريتانيين في الامتحانات',
        content: 'نثمن ونهنئ جميع الطلبة الموريتانيين الذين حققوا نتائج متميزة في امتحانات الفصل الأول. حقق طلبتنا معدلات نجاح عالية في مختلف التخصصات، وخاصة في كليات الطب والهندسة والعلوم. نتمنى لهم المزيد من التفوق والنجاح.',
        category: 'news',
        location: null,
        published: true
    },
    {
        title: 'ورشة عمل: كيفية كتابة السيرة الذاتية',
        content: 'ينظم الاتحاد ورشة عمل حول كتابة السيرة الذاتية والتحضير لمقابلات العمل. ستقدم الورشة نصائح عملية لإعداد سيرة ذاتية احترافية، وكيفية التميز في سوق العمل. الورشة مفتوحة لجميع الأعضاء.',
        category: 'event',
        location: 'مقر الاتحاد',
        published: true
    },
    {
        title: 'تحديث: إجراءات تجديد الإقامة',
        content: 'نود إبلاغ الطلبة بالإجراءات الجديدة لتجديد الإقامة. يجب تقديم الطلب قبل شهر من انتهاء صلاحية الإقامة الحالية. الوثائق المطلوبة: جواز السفر، شهادة التسجيل، إيصال الإقامة الجامعية، وصورتان شمسيتان. للمساعدة، تواصلوا مع مكتب الاتحاد.',
        category: 'announcement',
        location: null,
        published: true
    },
    {
        title: 'احتفالية عيد الاستقلال الموريتاني',
        content: 'بمناسبة الذكرى السنوية لاستقلال موريتانيا، ينظم الاتحاد احتفالية خاصة تتضمن فقرات ثقافية وفنية متنوعة. ندعو جميع أبناء الجالية للمشاركة في هذه المناسبة الوطنية الغالية. سيكون هناك عشاء جماعي بعد الاحتفال.',
        category: 'event',
        location: 'قاعة الاحتفالات الكبرى',
        published: true
    }
];

async function seedNews() {
    try {
        console.log('Initializing database...');
        await initializeDatabase();

        const supabase = getClient();

        console.log('\nAdding sample news articles...\n');

        for (const [index, news] of sampleNews.entries()) {
            const { error } = await supabase.from('news').insert(news);
            if (error) throw error;
            console.log(`${index + 1}. ${news.title.substring(0, 50)}...`);
        }

        console.log(`\nDone! Added ${sampleNews.length} news articles.`);
        console.log('\nYou can view them at:');
        console.log('- Website: http://localhost:3000/news');
        console.log('- Admin: http://localhost:3000/admin/news.html');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding news:', error);
        process.exit(1);
    }
}

seedNews();
