// هذا هو رابط الـ API الخاص بك الذي قمت بنشره
// تأكد من أن هذا الرابط هو نفسه الذي حصلت عليه من نشر Google Apps Script
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwb7t92o7-KN3JMbRUuefZKFvtNhvI1RxbVw0s9yEu2ytr_qgr8Uae8-en50mZvyz8f/exec';

document.addEventListener('DOMContentLoaded', async function() {
    // تعيين التاريخ والوقت الحاليين افتراضياً عند تحميل الصفحة
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    document.getElementById('visitDate').value = `${year}-${month}-${day}`;
    document.getElementById('visitTime').value = `${hours}:${minutes}`;

    // جلب وملء بيانات العملاء ومندوبي المبيعات والمنتجات عند تحميل الصفحة
    await fetchAndPopulateDropdowns();
});

document.getElementById('visitLogForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // منع إرسال النموذج بالطريقة التقليدية

    const responseMessage = document.getElementById('responseMessage');
    responseMessage.style.display = 'none'; // إخفاء الرسالة السابقة

    const formData = {
        Visit_ID: `VISIT_${Date.now()}`, // توليد ID فريد للزيارة
        Customer_ID: document.getElementById('customerId').value,
        Sales_Rep_ID: document.getElementById('salesRepId').value,
        Product_ID: document.getElementById('productId').value, // إضافة Product_ID
        Visit_Date: document.getElementById('visitDate').value,
        Visit_Time: document.getElementById('visitTime').value,
        Visit_Purpose: document.getElementById('visitPurpose').value,
        Visit_Outcome: document.getElementById('visitOutcome').value,
        Next_Visit_Date: document.getElementById('nextVisitDate').value,
        Notes: document.getElementById('notes').value,
    };

    // التحقق من أن الحقول المطلوبة ليست فارغة
    const requiredFields = ['Customer_ID', 'Sales_Rep_ID', 'Visit_Date', 'Visit_Time', 'Visit_Purpose', 'Visit_Outcome'];
    for (const field of requiredFields) {
        if (!formData[field]) {
            displayMessage(`الرجاء تعبئة جميع الحقول المطلوبة: ${field}`, 'error');
            return;
        }
    }

    const requestBody = {
        action: 'addVisitLog', // العمل الذي سيقوم به الـ API
        data: formData
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody) // تحويل الكائن إلى سلسلة JSON
        });

        const result = await response.json(); // تحليل الاستجابة JSON

        if (response.ok && result.status === 'success') {
            displayMessage('تمت إضافة سجل الزيارة بنجاح!', 'success');
            document.getElementById('visitLogForm').reset(); // مسح النموذج بعد النجاح
            // إعادة تعيين التاريخ والوقت الحاليين افتراضياً
            const now = new Date();
            const year = String(now.getFullYear());
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('visitDate').value = `${year}-${month}-${day}`;
            document.getElementById('visitTime').value = `${hours}:${minutes}`;

        } else {
            // التعامل مع الأخطاء من الـ API
            const errorMessage = result.message || 'حدث خطأ غير معروف.';
            displayMessage(`خطأ: ${errorMessage}`, 'error');
        }
    } catch (error) {
        // التعامل مع أخطاء الشبكة
        displayMessage(`فشل الاتصال بالخادم: ${error.message}`, 'error');
        console.error('Fetch error:', error);
    }
});


// دالة مساعدة لجلب البيانات من الـ API
async function fetchData(action, targetDropdownId, valueKey, textKey) {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST', // حتى لو كانت عملية جلب، نستخدم POST لتمرير 'action'
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: action })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success' && Array.isArray(result.data)) {
            populateDropdown(targetDropdownId, result.data, valueKey, textKey);
        } else {
            displayMessage(`خطأ في جلب بيانات ${action}: ${result.message || 'البيانات ليست مصفوفة أو الحالة ليست نجاح.'}`, 'error');
        }
    } catch (error) {
        displayMessage(`فشل في جلب بيانات ${action} من الخادم: ${error.message}`, 'error');
        console.error(`Error fetching ${action}:`, error);
    }
}

// دالة مساعدة لملء القوائم المنسدلة
function populateDropdown(dropdownId, data, valueKey, textKey) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.error(`Dropdown with ID ${dropdownId} not found.`);
        return;
    }
    // مسح الخيارات الحالية وإضافة خيار "الرجاء الاختيار..."
    dropdown.innerHTML = '<option value="">الرجاء الاختيار...</option>';
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[textKey]; // استخدام المفتاح الصحيح للاسم
        dropdown.appendChild(option);
    });
}

// دالة لجلب وملء جميع القوائم المنسدلة المطلوبة
async function fetchAndPopulateDropdowns() {
    // جلب العملاء وملء قائمة العملاء المنسدلة
    await fetchData('getCustomers', 'customerId', 'Customer_ID', 'Customer_Name_AR');

    // جلب مندوبي المبيعات وملء قائمة المندوبين المنسدلة
    await fetchData('getSalesReps', 'salesRepId', 'Sales_Rep_ID', 'Sales_Rep_Name_AR');

    // جلب المنتجات وملء قائمة المنتجات المنسدلة
    await fetchData('getProducts', 'productId', 'Product_ID', 'Product_Name_AR');
}


function displayMessage(message, type) {
    const responseMessage = document.getElementById('responseMessage');
    responseMessage.textContent = message;
    responseMessage.className = `response-message ${type}`;
    responseMessage.style.display = 'block';
}