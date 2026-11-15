// ============================================
// هيكل المنهج الدراسي - Kudosk
// نوع الدرس (type):
//   'card'  -> بطاقات معلومات (cards: [{emoji, title, body}])
//   'quiz'  -> اختبار اختيار من متعدد (questions: [...])
//   'maze'  -> لعبة متاهة (للأطفال - size/goal/threats/blocks)
//   'chat'  -> محادثة قصصية بين شخصيتين (characters: {a,b}, messages: [{from, text}])
//                الحدوتة بتتكشف وهي نازلة في الصفحة من غير أي سؤال جواها.
//                أمثلة الكود بتتحط كرسالة {code, filename, previewHtml?} وتظهر في بانل IDE
//                قابل للتشغيل؛ لو فيه previewHtml بيفتح معاينة حقيقية شغالة (iframe معزول).
//                لو الدرس عنده quiz: [...]، الأسئلة دي بتظهر بعد ما الحدوتة كلها تخلص.
//   'code'  -> محرر كود JS حقيقي شغال (task, targetSnippet, expectedOutput)
//
// منهج أولى ثانوي 2026 الحقيقي بيعتمد بالكامل على منصة Qureo (54 فصل JS)،
// وبيبدأ بـ: مقدمة/console.log -> المتغيرات -> الجمل الشرطية -> الدوال -> المصفوفات...
// ده أول 5 دروس من السلسلة بنفس الترتيب الحقيقي (مش كل الـ54 فصل - ده هيتبني تدريجيًا).
// باقي الصفوف (تالتة إعدادي/تانية بكالوريا) لسه زي ما هي.
// ============================================

const GRADES = [
  {
    "id": "prep3",
    "title": "الصف الثالث الإعدادي",
    "emoji": "📙"
  },
  {
    "id": "sec1",
    "title": "الصف الأول الثانوي",
    "emoji": "📗"
  },
  {
    "id": "bac2",
    "title": "الصف الثاني بكالوريا",
    "emoji": "📘"
  }
];

// مفتاح كل وحدة: `${gradeId}-${termId}`
const COURSES = {
  "sec1-term1": {
    "gradeId": "sec1",
    "termId": "term1",
    "termTitle": "الترم الأول",
    "units": [
      {
        "id": 1,
        "emoji": "🕸️",
        "title": "JavaScript — من الصفر",
        "lessons": [
          {
            "id": 1,
            "type": "chat",
            "emoji": "💬",
            "title": "مقدمة إلى JavaScript",
            "characters": {
              "a": {
                "name": "بيكسل",
                "emoji": "🤖"
              },
              "b": {
                "name": "نون",
                "emoji": "🧑‍🎓"
              }
            },
            "objectives": [
              "تعرف إيه هي JavaScript ولوحدة التحكم (Console)",
              "تكتب أول سطر كود وتشغّله فعليًا"
            ],
            "messages": [
              {
                "from": "a",
                "text": "أهلًا بيك! دلوقتي هنبدأ أول لغة برمجة حقيقية في رحلتنا: <b>JavaScript</b>."
              },
              {
                "from": "b",
                "text": "سمعت الاسم ده قبل كده بس مش عارف هي بتعمل إيه بالظبط."
              },
              {
                "from": "a",
                "text": "JavaScript هي اللغة اللي بتشتغل جوه متصفح الويب، وبتخلي صفحات الإنترنت تتحرك وتستجيب لك — لكن قبل كل ده، هنتعلمها بأبسط طريقة ممكنة."
              },
              {
                "from": "b",
                "text": "وإزاي هنشوف نتيجة الكود اللي هنكتبه؟"
              },
              {
                "from": "a",
                "text": "في <b>وحدة التحكم (Console)</b> — مكان بيعرضلك أي نص أو نتيجة تطلبها منه، باستخدام أمر بسيط اسمه <code>console.log()</code>."
              },
              {
                "code": "console.log(\"Let's calculate.\");",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "يعني لو كتبت console.log وحطيت جواه أي كلام بين قوسين، هيطبعه في وحدة التحكم؟"
              },
              {
                "from": "a",
                "text": "بالظبط! أي نص بتحطه بين علامتي تنصيص جوه القوسين، console.log هيعرضه ليك فورًا لما تشغّل الكود."
              },
              {
                "from": "b",
                "text": "وينفع أعرض أرقام وعمليات حسابية مش نصوص بس؟"
              },
              {
                "code": "console.log(1 + 1);",
                "filename": "script.js"
              },
              {
                "from": "a",
                "text": "أيوه بالظبط — مش بس برنامج لعرض النصوص، JavaScript تقدر كمان تحسب بيها أي عملية حسابية وتعرض ناتجها على طول."
              },
              {
                "from": "b",
                "text": "افتكر: console.log() هو أول وأهم أمر هتستخدمه في كل درس جاي — بتشوف بيه نتيجة أي حاجة بتكتبها."
              }
            ],
            "quiz": [
              {
                "text": "عايز تعرض الجملة \"مرحبًا\" في وحدة التحكم — هتستخدم إيه؟",
                "choices": [
                  "console.log(\"مرحبًا\");",
                  "console.print(\"مرحبًا\");",
                  "print(\"مرحبًا\");"
                ],
                "correct": 0,
                "explain": "console.log() هو الأمر الصحيح لعرض أي نص أو قيمة في وحدة التحكم."
              },
              {
                "text": "console.log(5 + 3); هيطبع إيه في وحدة التحكم؟",
                "choices": [
                  "5 + 3",
                  "8",
                  "خطأ"
                ],
                "correct": 1,
                "explain": "JavaScript بتحسب العملية الحسابية الأول (5+3=8) وبعدين تعرض الناتج."
              }
            ]
          },
          {
            "id": 2,
            "type": "code",
            "emoji": "👨‍💻",
            "title": "هيا نجرّب: أول سطر كود",
            "task": "اكتب سطر JavaScript يعرض الجملة \"Hello, JavaScript!\" في وحدة النتائج.",
            "targetSnippet": "console.log(\"Hello, JavaScript!\");",
            "starterCode": "console.log(\"Hello, JavaScript!\");",
            "placeholder": "اكتب الكود هنا...",
            "expectedOutput": "Hello, JavaScript!",
            "successMsg": "تمام كده! console.log() هو أبسط طريقة تشوف بيها ناتج الكود بتاعك وإنت بتجرب."
          },
          {
            "id": 3,
            "type": "chat",
            "emoji": "💬",
            "title": "المتغيرات (Variables)",
            "characters": {
              "a": {
                "name": "بيكسل",
                "emoji": "🤖"
              },
              "b": {
                "name": "نون",
                "emoji": "🧑‍🎓"
              }
            },
            "objectives": [
              "تفهم إيه هو المتغير وليه بنستخدمه",
              "تفرّق بين let وconst وتستخدم كل واحد في مكانه الصح"
            ],
            "messages": [
              {
                "from": "a",
                "text": "تخيل إنك عايز تستخدم نفس القيمة كذا مرة في البرنامج — هتكررها كل مرة؟"
              },
              {
                "from": "b",
                "text": "طبعًا لأ، تعبان أوي كده."
              },
              {
                "from": "a",
                "text": "عشان كده عندنا <b>المتغيرات (Variables)</b> — صندوق بتحط فيه قيمة وتديله اسم، وتستخدم الاسم ده بدل ما تكرر القيمة."
              },
              {
                "code": "let score = 10;\nconsole.log(score);",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "طب إيه الفرق بين let وconst اللي باسمعهم؟"
              },
              {
                "from": "a",
                "text": "<code>let</code> لمتغير ممكن تغيّر قيمته بعدين، و<code>const</code> لقيمة ثابتة مش هتتغيّر أبدًا بعد ما تحددها."
              },
              {
                "code": "let score = 10;\nscore = 20; // مسموح، لأنها let\n\nconst pi = 3.14;\n// pi = 3.15; // ده هيدّي خطأ، لأنها const",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "يعني لو عارف إن القيمة مش هتتغير أبدًا، أستخدم const؟"
              },
              {
                "from": "a",
                "text": "بالظبط. وفيه كمان أنواع بيانات مختلفة تقدر تخزنها في المتغير: أرقام (Number)، نصوص (String) بين علامتي تنصيص، وقيم صح/غلط (Boolean) زي true وfalse."
              },
              {
                "code": "let age = 16;        // Number\nlet name = \"Adam\";   // String\nlet isStudent = true; // Boolean",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "افتكر: اسم المتغير لازم يبقى واضح ويوصف القيمة اللي جواه — score أوضح بكتير من x مثلًا."
              }
            ],
            "quiz": [
              {
                "text": "عايز تخزّن عمر الطالب في متغير اسمه age علشان تستخدمه في العملية الحسابية بعد كده — هتعرّفه إزاي؟",
                "choices": [
                  "let age = 16;",
                  "age == 16;",
                  "number age = 16;"
                ],
                "correct": 0,
                "explain": "let (أو const) هي الطريقة الصحيحة لتعريف متغير جديد في JavaScript."
              },
              {
                "text": "عندك قيمة متأكد إنها مش هتتغيّر خالص طول البرنامج (زي قيمة ثابتة رياضية) — هتستخدم إيه؟",
                "choices": [
                  "let",
                  "const",
                  "var فقط"
                ],
                "correct": 1,
                "explain": "const مخصصة للقيم الثابتة التي لا تتغير بعد تعريفها."
              }
            ]
          },
          {
            "id": 4,
            "type": "chat",
            "emoji": "💬",
            "title": "الجمل الشرطية (if/else)",
            "characters": {
              "a": {
                "name": "بيكسل",
                "emoji": "🤖"
              },
              "b": {
                "name": "نون",
                "emoji": "🧑‍🎓"
              }
            },
            "objectives": [
              "تخلي البرنامج ياخد قرار مختلف حسب الموقف",
              "تستخدم if وelse وelse if بشكل صحيح"
            ],
            "messages": [
              {
                "from": "a",
                "text": "دلوقتي هنخلي البرنامج \"يفكر\" — ياخد قرار مختلف حسب الموقف، مش يعمل نفس الحاجة دايمًا."
              },
              {
                "from": "b",
                "text": "يعني زي لما بقول لنفسي: لو الجو حر هلبس قميص، لو برد هلبس چاكيت؟"
              },
              {
                "from": "a",
                "text": "بالظبط كده! في JavaScript بنستخدم <code>if</code> (لو) و<code>else</code> (غير كده) بنفس الفكرة."
              },
              {
                "code": "let temperature = 35;\n\nif (temperature > 30) {\n  console.log(\"الجو حر، خد مياه معاك!\");\n} else {\n  console.log(\"الجو عادي.\");\n}",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "وإيه لو عايز أكتر من احتمالين؟"
              },
              {
                "from": "a",
                "text": "تضيف <code>else if</code> بينهم — بتتفحص بالترتيب لحد ما تلاقي الشرط الصح."
              },
              {
                "code": "let grade = 75;\n\nif (grade >= 90) {\n  console.log(\"ممتاز\");\n} else if (grade >= 65) {\n  console.log(\"جيد\");\n} else {\n  console.log(\"محتاج مذاكرة أكتر\");\n}",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "وإزاي بكتب شرط زي \"أكبر من\" أو \"يساوي\"؟"
              },
              {
                "from": "a",
                "text": "فيه رموز بسيطة: <code>&gt;</code> أكبر من، <code>&lt;</code> أصغر من، <code>===</code> يساوي بالظبط، <code>&gt;=</code> أكبر من أو يساوي."
              },
              {
                "from": "b",
                "text": "افتكر: لازم الشرط يكون جوه قوسين ()، والكود اللي هيتنفذ لو الشرط صح يكون جوه قوسين معقوفين { }."
              }
            ],
            "quiz": [
              {
                "text": "عايز البرنامج يطبع \"ناجح\" بس لو الدرجة 50 أو أكتر — هتكتب الشرط إزاي؟",
                "choices": [
                  "if (grade >= 50)",
                  "if (grade > 50 only)",
                  "if grade >= 50"
                ],
                "correct": 0,
                "explain": "الشرط لازم يكون جوه قوسين، والرمز >= يعني أكبر من أو يساوي."
              },
              {
                "text": "عندك أكتر من احتمال محتاج تتفحصهم بالترتيب بعد شرط if الأول — هتستخدم إيه؟",
                "choices": [
                  "else if",
                  "elif",
                  "then if"
                ],
                "correct": 0,
                "explain": "else if هي الصياغة الصحيحة في JavaScript لإضافة شرط إضافي بعد if."
              }
            ]
          },
          {
            "id": 5,
            "type": "code",
            "emoji": "👨‍💻",
            "title": "هيا نجرّب: قرار بالكود",
            "task": "اكتب كود يعرض \"درجة حرارة عالية!\" لو المتغير temperature أكبر من 30.",
            "targetSnippet": "let temperature = 35;\nif (temperature > 30) {\n  console.log(\"درجة حرارة عالية!\");\n}",
            "starterCode": "let temperature = 35;\nif (temperature > 30) {\n  console.log(\"درجة حرارة عالية!\");\n}",
            "placeholder": "اكتب الكود هنا...",
            "expectedOutput": "درجة حرارة عالية!",
            "successMsg": "تمام! كده عملت أول قرار بالكود — البرنامج فحص الشرط واختار الاستجابة الصح."
          },
          {
            "id": 6,
            "type": "chat",
            "emoji": "💬",
            "title": "الدوال (Functions)",
            "characters": {
              "a": { "name": "بيكسل", "emoji": "🤖" },
              "b": { "name": "نون", "emoji": "🧑‍🎓" }
            },
            "objectives": [
              "تفهم إيه هي الدالة وليه بنستخدمها",
              "تكتب دالة بسيطة وتناديها (تستدعيها) أكتر من مرة"
            ],
            "messages": [
              {
                "from": "a",
                "text": "تخيّل إن عندك كود بتحتاج تكرره كذا مرة في البرنامج — بدل ما تكتبه كل مرة، بنحطه جوه <b>دالة (function)</b> مرة واحدة ونناديها براحتنا."
              },
              {
                "from": "b",
                "text": "يعني زي اختصار للكود؟"
              },
              {
                "from": "a",
                "text": "بالظبط. بنعرّف الدالة بكلمة <code>function</code> واسم ليها، وبعدين أي وقت نكتب الاسم ده متبوع بقوسين، الكود اللي جواها بيتنفذ."
              },
              {
                "code": "function sayHello() {\n  console.log(\"أهلًا بيك!\");\n}\n\nsayHello();\nsayHello();",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "طبعتلي \"أهلًا بيك!\" مرتين! يعني كل ما أنادي sayHello()، الكود بتاعها بيتنفذ من الأول."
              },
              {
                "from": "a",
                "text": "تمام — وممكن كمان الدالة تاخد \"مدخلات\" (parameters) جوه القوسين، عشان تتصرف على حسب القيمة اللي بتدّيها ليها."
              },
              {
                "code": "function greet(name) {\n  console.log(\"أهلًا يا \" + name);\n}\n\ngreet(\"نون\");\ngreet(\"بيكسل\");",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "آه فهمت — name دي متغيّر بياخد قيمة مختلفة كل مرة بنادي فيها الدالة."
              },
              {
                "from": "a",
                "text": "بالظبط كده! الدوال من أقوى أدوات البرمجة — بتخليك تنظّم كودك وتتجنّب تكرار نفس الحاجة أكتر من مرة."
              }
            ],
            "quiz": [
              {
                "text": "إيه الكلمة اللي بنستخدمها عشان نعرّف دالة جديدة في JavaScript؟",
                "choices": ["function", "define", "method"],
                "correct": 0,
                "explain": "function هي الكلمة المحجوزة الصحيحة لتعريف دالة في JavaScript."
              },
              {
                "text": "لو عندنا function greet(name) { console.log(name); } وناديناها greet(\"نون\")، هتطبع إيه؟",
                "choices": ["name", "نون", "greet"],
                "correct": 1,
                "explain": "name بتاخد قيمة \"نون\" وقت النداء، فبتتطبع \"نون\" فعليًا."
              }
            ]
          },
          {
            "id": 7,
            "type": "code",
            "emoji": "👨‍💻",
            "title": "هيا نجرّب: دالة بسيطة",
            "task": "اكتب دالة اسمها square بتاخد رقم x وتعرض ناتج ضربه في نفسه (x * x)، وناديها بالقيمة 4.",
            "targetSnippet": "function square(x) {\n  console.log(x * x);\n}\n\nsquare(4);",
            "starterCode": "function square(x) {\n  console.log(x * x);\n}\n\nsquare(4);",
            "placeholder": "اكتب الكود هنا...",
            "expectedOutput": "16",
            "successMsg": "تمام! عملت أول دالة بتاخد مدخل وتحسب بيه — كده قدرت تكرر نفس الحساب لأي رقم من غير ما تعيد كتابة الكود."
          },
          {
            "id": 8,
            "type": "chat",
            "emoji": "💬",
            "title": "المصفوفات (Arrays)",
            "characters": {
              "a": { "name": "بيكسل", "emoji": "🤖" },
              "b": { "name": "نون", "emoji": "🧑‍🎓" }
            },
            "objectives": [
              "تفهم إيه هي المصفوفة وليه بنستخدمها بدل متغيرات منفصلة",
              "توصل لعنصر معيّن جوه مصفوفة باستخدام الـ index"
            ],
            "messages": [
              {
                "from": "a",
                "text": "لو عايز تخزّن أسامي 3 طلاب، هتعمل 3 متغيرات منفصلة؟ فيه طريقة أذكى: <b>المصفوفة (Array)</b> — بتخزّن مجموعة قيم جوه متغيّر واحد."
              },
              {
                "code": "let students = [\"نون\", \"سارة\", \"علي\"];\nconsole.log(students);",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "وإزاي أوصل لعنصر واحد منهم بس، مش كل المصفوفة؟"
              },
              {
                "from": "a",
                "text": "باستخدام <b>الـ index</b> (الترقيم) جوه قوسين مربعين — وأهم حاجة: الترقيم في JavaScript بيبدأ من <code>0</code> مش من 1."
              },
              {
                "code": "let students = [\"نون\", \"سارة\", \"علي\"];\nconsole.log(students[0]);\nconsole.log(students[2]);",
                "filename": "script.js"
              },
              {
                "from": "b",
                "text": "يعني students[0] هو \"نون\" أول واحد، وstudents[2] هو \"علي\" تالت واحد — مش تالت index."
              },
              {
                "from": "a",
                "text": "بالظبط! وفيه كمان خاصية مفيدة جدًا: <code>.length</code> بتقولك عدد العناصر جوه المصفوفة."
              },
              {
                "code": "let students = [\"نون\", \"سارة\", \"علي\"];\nconsole.log(students.length);",
                "filename": "script.js"
              }
            ],
            "quiz": [
              {
                "text": "لو let fruits = [\"تفاح\", \"موز\", \"مانجا\"]، قيمة fruits[1] هتبقى إيه؟",
                "choices": ["تفاح", "موز", "مانجا"],
                "correct": 1,
                "explain": "الترقيم بيبدأ من 0، فـfruits[0] هو \"تفاح\" وfruits[1] هو \"موز\"."
              },
              {
                "text": "إيه اللي بترجّعه fruits.length لو المصفوفة فيها 3 عناصر؟",
                "choices": ["2", "3", "آخر عنصر في المصفوفة"],
                "correct": 1,
                "explain": "length بترجّع عدد العناصر الكلي جوه المصفوفة، يعني 3."
              }
            ]
          },
          {
            "id": 9,
            "type": "code",
            "emoji": "👨‍💻",
            "title": "هيا نجرّب: مصفوفة",
            "task": "اعمل مصفوفة اسمها colors فيها \"أحمر\" و\"أخضر\" و\"أزرق\"، واعرض العنصر التاني فيها (index رقم 1).",
            "targetSnippet": "let colors = [\"أحمر\", \"أخضر\", \"أزرق\"];\nconsole.log(colors[1]);",
            "starterCode": "let colors = [\"أحمر\", \"أخضر\", \"أزرق\"];\nconsole.log(colors[1]);",
            "placeholder": "اكتب الكود هنا...",
            "expectedOutput": "أخضر",
            "successMsg": "تمام! كده قدرت تخزّن مجموعة قيم في مصفوفة وتوصل لعنصر معيّن منها بالـindex الصح."
          }
        ]
      }
    ]
  },
  "sec1-term2": {
    "gradeId": "sec1",
    "termId": "term2",
    "termTitle": "الترم الثاني",
    "units": []
  },
  "prep3-term1": {
    "gradeId": "prep3",
    "termId": "term1",
    "termTitle": "الترم الأول",
    "units": [
      {
        "id": 201,
        "emoji": "🤖",
        "title": "الذكاء الاصطناعي ولغات البرمجة",
        "lessons": [
          {
            "id": 1,
            "type": "chat",
            "emoji": "💬",
            "title": "السلاسل النصية والقوائم في بايثون",
            "characters": {
              "a": {
                "name": "بيكسل",
                "emoji": "🤖"
              },
              "b": {
                "name": "نون",
                "emoji": "🧑‍🎓"
              }
            },
            "messages": [
              {
                "from": "a",
                "text": "دلوقتي هنتعلم لغة <b>بايثون (Python)</b> — هنبدأ بالسلاسل النصية والقوائم."
              },
              {
                "from": "b",
                "text": "إيه الفرق بينهم؟"
              },
              {
                "from": "a",
                "text": "<b>السلسلة النصية (String)</b> هي مجموعة حروف أو أرقام جوه علامتي تنصيص، زي \"hello\"."
              },
              {
                "from": "b",
                "text": "وأقدر أوصل لحرف معين جواها إزاي؟"
              },
              {
                "from": "a",
                "text": "بـ<b>الفهرسة (Index)</b> — كل حرف ليه رقم ترتيب يبدأ من صفر. يعني text[0] هيرجعلك أول حرف."
              },
              {
                "from": "b",
                "text": "وبرضه فيه <b>القائمة (List)</b> — مجموعة قيم جوه قوسين مربعين [ ]، وعلى عكس النص، هي قابلة للتعديل (Mutable) بعد ما تتعمل."
              },
              {
                "from": "a",
                "text": "تقدر تضيف عنصر بـ<code>append()</code> في آخر القائمة، أو تشيل عنصر بـ<code>remove()</code>."
              },
              {
                "from": "b",
                "text": "مثال: <code>text = \"hello\"</code>، <code>letters = list(text)</code> بتحول النص لقائمة حروف، وبعدين <code>for letter in letters: print(letter)</code> بيطبع كل حرف لوحده."
              },
              {
                "from": "a",
                "text": "افتكر: النص (String) مينفعش تعدله بعد ما يتعمل، لكن القائمة (List) تقدر تعدلها زي ما تحب."
              }
            ]
          },
          {
            "id": 2,
            "type": "chat",
            "emoji": "💬",
            "title": "الدوال ذات المعاملات",
            "characters": {
              "a": {
                "name": "بيكسل",
                "emoji": "🤖"
              },
              "b": {
                "name": "نون",
                "emoji": "🧑‍🎓"
              }
            },
            "messages": [
              {
                "from": "a",
                "text": "الدرس ده عن <b>الدوال (Functions)</b> في بايثون — كود تكتبه مرة وتستخدمه كذا مرة."
              },
              {
                "from": "b",
                "text": "وإزاي بعرّف دالة جديدة؟"
              },
              {
                "from": "a",
                "text": "بالكلمة المفتاحية <code>def</code>، متبوعة باسم الدالة وقوسين فيهم <b>المعاملات (Parameters)</b> اللي الدالة هتشتغل عليها."
              },
              {
                "from": "b",
                "text": "وبعد ما تجهز نتيجة جوه الدالة، إزاي ترجعها؟"
              },
              {
                "from": "a",
                "text": "بـ<code>return</code> — بترجع القيمة للمكان اللي استدعى الدالة، فتقدر تخزنها في متغير. أما <code>print()</code> فبس بتعرضها على الشاشة من غير ما ترجعها لحد."
              },
              {
                "from": "b",
                "text": "مثال: <code>def circle_area(radius): pi = 3.14; area = pi * radius * radius; return area</code> — وبعدين <code>result = circle_area(5)</code> بتخزن الناتج في result."
              },
              {
                "from": "a",
                "text": "افتكر: الدالة = اسم بعد def + معاملات بين قوسين + كود. استخدم return لو عايز تخزن الناتج، واستخدم print() لو بس عايز تشوفه."
              }
            ]
          },
          {
            "id": 3,
            "type": "chat",
            "emoji": "💬",
            "title": "معالجة أخطاء مدخلات المستخدم",
            "characters": {
              "a": {
                "name": "بيكسل",
                "emoji": "🤖"
              },
              "b": {
                "name": "نون",
                "emoji": "🧑‍🎓"
              }
            },
            "messages": [
              {
                "from": "a",
                "text": "آخر درس في الوحدة دي: إزاي تتعامل لو المستخدم دخل بيانات غلط؟"
              },
              {
                "from": "b",
                "text": "زي إيه مثلاً؟"
              },
              {
                "from": "a",
                "text": "زي لو طلبت رقم بدالة <code>input()</code> وهو كتب حروف — ده بيطلع خطأ اسمه <b>ValueError</b>. أو لو قسمت على صفر — ده <b>ZeroDivisionError</b>."
              },
              {
                "from": "b",
                "text": "وإزاي أمنع البرنامج من التوقف فجأة لما يحصل خطأ؟"
              },
              {
                "from": "a",
                "text": "بـ<code>try</code> و<code>except</code>: try بتجرب تنفذ كود ممكن يسبب خطأ، ولو حصل فعلاً، التنفيذ بينتقل لـ except بدل ما البرنامج يقف."
              },
              {
                "from": "b",
                "text": "مثال: <code>try: num = int(input(\"Enter a number: \")); result = 10 / num; print(result) except ValueError: print(\"دخل غلط!\") except ZeroDivisionError: print(\"معرفش تقسم على صفر!\")</code>"
              },
              {
                "from": "a",
                "text": "افتكر: try تجرب، ولو حصل خطأ بتنده لـ except المناسب بدل ما البرنامج يقف فجأة. وممكن تحط أكتر من except لمعالجة أنواع مختلفة من الأخطاء."
              }
            ]
          }
        ]
      }
    ]
  },
  "prep3-term2": {
    "gradeId": "prep3",
    "termId": "term2",
    "termTitle": "الترم الثاني",
    "units": []
  },
  "bac2-term1": {
    "gradeId": "bac2",
    "termId": "term1",
    "termTitle": "الترم الأول",
    "units": [
      {
        "id": 103,
        "emoji": "💻",
        "title": "تطبيقات الويب",
        "lessons": [
          {
            "id": 1,
            "type": "chat",
            "emoji": "💬",
            "title": "أساسيات تقنية الواجهة الأمامية",
            "characters": {
              "a": {
                "name": "بيكسل",
                "emoji": "🤖"
              },
              "b": {
                "name": "نون",
                "emoji": "🧑‍🎓"
              }
            },
            "messages": [
              {
                "from": "a",
                "text": "دلوقتي هنفهم 3 تقنيات أساسية في أي صفحة ويب: HTML وCSS وJavaScript."
              },
              {
                "from": "b",
                "text": "كل واحدة بتعمل إيه بالظبط؟"
              },
              {
                "from": "a",
                "text": "<b>HTML</b> بيحدد بنية الصفحة (العناوين والفقرات والصور)، <b>CSS</b> بيحدد المظهر (الألوان والتخطيط)، و<b>JavaScript</b> بيضيف السلوك والتفاعلية — زي مبنى: الهيكل الإنشائي، الديكور، وأنظمة الكهرباء والسباكة."
              },
              {
                "from": "b",
                "text": "سمعت عن حاجة اسمها HTML الدلالية (Semantic HTML)؟"
              },
              {
                "from": "a",
                "text": "أيوه — بدل ما تستخدم صناديق div عامة، تستخدم عناصر توضح وظيفتها زي <code>&lt;header&gt;</code> و<code>&lt;nav&gt;</code> و<code>&lt;main&gt;</code> و<code>&lt;footer&gt;</code>. ده بيحسن إمكانية الوصول (Accessibility) وفهم محركات البحث (SEO)."
              },
              {
                "from": "b",
                "text": "وفيه كمان <b>التصميم المتجاوب (Responsive Design)</b> — التخطيط بيتعدل أوتوماتيك حسب حجم الشاشة، كمبيوتر كان أو موبايل."
              },
              {
                "from": "a",
                "text": "وعشان متكتبش كل كود من الصفر، بتستخدم <b>إطار عمل (Framework)</b> زي React أو Vue أو Next.js — بيوفرولك مكونات ووظائف جاهزة."
              },
              {
                "from": "b",
                "text": "مثال: <code>&lt;header&gt;عنوان الموقع&lt;/header&gt; &lt;nav&gt;روابط التنقل&lt;/nav&gt; &lt;main&gt;...&lt;/main&gt; &lt;footer&gt;...&lt;/footer&gt;</code> — كل وسم واضح وظيفته من غير ما تحتاج تقرا الكود كله."
              },
              {
                "from": "a",
                "text": "افتكر: صفحة الويب تركيبة مش تقنية واحدة — HTML للبنية، CSS للمظهر، JS للتفاعلية، والـ Semantic HTML والتصميم المتجاوب وأطر العمل بتخلي الموقع أقوى وأسهل في الصيانة."
              }
            ]
          }
        ]
      }
    ]
  },
  "bac2-term2": {
    "gradeId": "bac2",
    "termId": "term2",
    "termTitle": "الترم الثاني",
    "units": []
  }
};

function getCourseKey(gradeId, termId) {
  return `${gradeId}-${termId}`;
}
