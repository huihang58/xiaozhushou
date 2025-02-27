// 和风天气API配置
// 从环境变量中获取API密钥
const API_KEY = process.env.API_KEY || 'your-api-key-here';
const BASE_URL = 'https://devapi.qweather.com/v7';  

// 获取实时天气数据
async function getWeatherData(city) {
    try {
        console.log(`正在请求天气数据，城市：${city}`);
        // 先获取城市ID
        const locationResponse = await fetch(
            `https://geoapi.qweather.com/v2/city/lookup?key=${API_KEY}&location=${encodeURIComponent(city)}`
        );
        
        if (!locationResponse.ok) {
            throw new Error('城市查询失败，请检查网络连接');
        }
        
        const locationData = await locationResponse.json();
        if (locationData.code !== '200' || !locationData.location || locationData.location.length === 0) {
            throw new Error('找不到该城市，请检查城市名称是否正确');
        }
        
        const cityId = locationData.location[0].id;
        
        // 获取实时天气数据
        const weatherResponse = await fetch(
            `https://devapi.qweather.com/v7/weather/now?key=${API_KEY}&location=${cityId}`
        );
        
        if (!weatherResponse.ok) {
            throw new Error('天气数据获取失败，请稍后重试');
        }
        
        const weatherData = await weatherResponse.json();
        if (weatherData.code !== '200') {
            throw new Error(`查询失败: ${weatherData.message || '请稍后重试'}`);
        }
        
        // 转换数据格式
        return {
            name: city,
            main: {
                temp: parseFloat(weatherData.now.temp), // 不需要转换为开尔文温度
                humidity: weatherData.now.humidity,
                pressure: weatherData.now.pressure,
                feels_like: parseFloat(weatherData.now.feelsLike)
            },
            weather: [{
                main: weatherData.now.text,
                description: weatherData.now.text,
                icon: weatherData.now.icon
            }],
            wind: {
                speed: weatherData.now.windSpeed
            }
        };
    } catch (error) {
        console.error('获取天气数据失败:', error);
        alert(error.message);
        return null;
    }
}

// 获取天气预报数据
async function getForecastData(city) {
    try {
        console.log(`正在请求天气预报数据，城市：${city}`);
        
        // 先获取城市ID
        const locationResponse = await fetch(
            `https://geoapi.qweather.com/v2/city/lookup?key=${API_KEY}&location=${encodeURIComponent(city)}`
        );
        
        if (!locationResponse.ok) {
            throw new Error('城市查询失败');
        }
        
        const locationData = await locationResponse.json();
        if (locationData.code !== '200' || !locationData.location || locationData.location.length === 0) {
            throw new Error('找不到该城市');
        }
        
        const cityId = locationData.location[0].id;
        
        // 获取7天天气预报
        const forecastResponse = await fetch(
            `https://devapi.qweather.com/v7/weather/7d?key=${API_KEY}&location=${cityId}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('天气预报数据获取失败');
        }
        
        const forecastData = await forecastResponse.json();
        if (forecastData.code !== '200') {
            throw new Error('天气预报数据获取失败');
        }
        
        // 转换数据格式以匹配现有代码
        return {
            list: forecastData.daily.map(day => ({
                dt: new Date(day.fxDate).getTime() / 1000,
                main: {
                    temp: (parseInt(day.tempMax) + parseInt(day.tempMin)) / 2,  // 不需要转换为开尔文温度
                    humidity: day.humidity
                },
                weather: [{
                    main: day.textDay,
                    description: day.textDay,
                    icon: day.iconDay
                }]
            }))
        };
    } catch (error) {
        console.error('获取天气预报失败:', error);
        return null;
    }
}

// 工具函数
const kelvinToCelsius = (kelvin) => Math.round(kelvin - 273.15);

// 获取穿衣建议
const getClothingAdvice = (temp, weather) => {
    let advice = '';
    
    // 基础温度建议
    if (temp >= 30) {
        advice = '🌞 炎热天气穿搭指南：\n\n- 清爽穿搭：\n  · 轻薄、透气的纯棉T恤\n  · 宽松短裤或裙装\n  · 凉鞋或透气运动鞋\n\n- 防晒必备：\n  · 防晒衣或防晒伞\n  · 遮阳帽\n  · 防晒霜（SPF30+）';
    } else if (temp >= 20) {
        advice = '🌤️ 舒适温度穿搭指南：\n\n- 日常搭配：\n  · 短袖T恤或衬衫\n  · 休闲长裤或半身裙\n  · 帆布鞋或运动鞋';
    } else if (temp >= 15) {
        advice = '🍂 温和天气穿搭指南：\n\n- 基础搭配：\n  · 长袖衬衫或毛衣\n  · 休闲裤或牛仔裤\n  · 轻便外套';
    } else if (temp >= 10) {
        advice = '🍁 微凉天气穿搭指南：\n\n- 保暖搭配：\n  · 高领毛衣或卫衣\n  · 加厚休闲裤\n  · 外套或夹克';
    } else if (temp >= 5) {
        advice = '❄️ 寒凉天气穿搭指南：\n\n- 御寒搭配：\n  · 保暖内衣\n  · 毛衣或针织衫\n  · 加厚外套';
    } else {
        advice = '🥶 严寒天气穿搭指南：\n\n- 重点保暖：\n  · 保暖内衣套装\n  · 羊毛衫或加厚毛衣\n  · 羽绒服或棉服';
    }
    
    // 根据天气状况追加建议
    if (weather.includes('雨')) {
        advice += '\n\n🌧️ 雨天特别提醒：\n- 便携雨伞必不可少\n- 选择防水外套\n- 穿防滑防水鞋';
    } else if (weather.includes('雪')) {
        advice += '\n\n❄️ 雪天特别提醒：\n- 防水防滑雪地靴\n- 防水防风外套\n- 保暖手套必备';
    }
    
    return advice;
};

// 获取天气图标URL
const getWeatherIconUrl = (iconCode) => {
    // 使用和风天气官方图标
    return `https://devapi.qweather.com/v7/weather/icons/${iconCode}.png`;
};

// 获取天气心情
const getWeatherMood = (weather, temp) => {
    const moods = {
        '晴': ['阳光明媚，心情也跟着明亮起来！☀️', '晴空万里，是出门散步的好时机~', '今天阳光正好，适合晒被子和心情！', '蓝天白云相伴，是个出游的好日子！'],
        '多云': ['云朵朵点缀天空，温柔又浪漫！☁️', '多云的天气，适合发发呆看看云~', '云层厚厚的，像棉花糖一样美味~', '云朵变幻莫测，不如一起找找有趣的形状？'],
        '阴': ['阴天也有阴天的美，适合安静地发呆~', '没有太阳的天气，更适合专注做事情！', '阴天气温舒适，很适合出门运动~'],
        '雨': ['下雨天啦，听听雨声也是种享受！🌧️', '雨天带来清新的空气，深呼吸~', '雨滴敲打窗棂的声音，是大自然的音乐~', '雨天最适合来杯热茶，看看书了！'],
        '雪': ['下雪啦！堆个雪人怎么样？❄️', '白茫茫的世界，美得像童话！', '踩在雪地上咯吱作响，童年感觉又回来了~', '飘雪的日子，适合窝在家里喝热巧克力！'],
        '雷': ['打雷啦，记得关好门窗躲雨哦！⛈️', '暴风雨中感受大自然的力量~', '雷雨天气最适合睡个午觉了~', '窗外电闪雷鸣，窝在家里特别安心！'],
        '雾': ['雾蒙蒙的，仿佛身处仙境！', '雾天出行要小心，注意安全哦~', '雾气笼罩，整个世界都安静下来了~', '雾中的城市，多了几分神秘感~']
    };
    
    // 根据天气文字匹配对应心情
    let matchedWeather = Object.keys(moods).find(key => weather.includes(key));
    const weatherMoods = matchedWeather ? moods[matchedWeather] : ['今天的天气很特别呢！', '无论天气如何，心情都要美美哒~', '特别的天气，带来特别的心情~'];
    return weatherMoods[Math.floor(Math.random() * weatherMoods.length)];
};

// 更新当前天气显示
function updateCurrentWeather(data) {
    console.log('正在更新当前天气显示，数据:', data);
    if (!data) {
        console.warn('没有收到天气数据，无法更新显示');
        return;
    }

    const cityName = document.querySelector('.city-name');
    const temperature = document.querySelector('.temperature');
    const weatherDescription = document.querySelector('.weather-description');
    const details = document.querySelector('.details');
    const weatherIcon = document.querySelector('.weather-icon');

    cityName.textContent = data.name;
    temperature.textContent = `${data.main.temp}°C`;  // 直接使用温度值，不需要转换
    weatherDescription.textContent = data.weather[0].description;

    details.innerHTML = `
        <span>湿度: ${data.main.humidity}%</span>
        <span>风速: ${data.wind.speed} m/s</span>
    `;

    weatherIcon.innerHTML = `<img src="${getWeatherIconUrl(data.weather[0].icon)}" alt="天气图标" onerror="this.src='https://a.hecdn.net/img/common/icon/202106/999.png'">`;

    // 更新穿衣建议
    const adviceContent = document.querySelector('.advice-content');
    const temp = data.main.temp;  // 直接使用温度值，不需要转换
    const weatherText = data.weather[0].description;  // 使用天气描述文字
    adviceContent.innerHTML = `
        <p class="weather-mood">${getWeatherMood(weatherText, temp)}</p>
        <p class="clothing-tips">${getClothingAdvice(temp, weatherText)}</p>
    `;
}

// 更新天气预报显示
function updateForecast(data) {
    if (!data) return;

    const forecastList = document.querySelector('.forecast-list');
    forecastList.innerHTML = '';

    // 获取未来5天的天气预报
    const dailyForecasts = data.list;

    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const temp = forecast.main.temp;  // 直接使用温度，不需要转换
        const icon = forecast.weather[0].icon;

        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div>${date.toLocaleDateString('zh-CN', { weekday: 'short' })}</div>
            <img src="${getWeatherIconUrl(icon)}" alt="天气图标" style="width: 50px;">
            <div>${temp}°C</div>
            <div>${forecast.weather[0].description}</div>
        `;

        forecastList.appendChild(forecastItem);
    });
}

// 添加城市到对比列表
function addCityToComparison(data) {
    if (!data) return;

    const cityList = document.querySelector('.city-list');
    const cityItem = document.createElement('div');
    cityItem.className = 'city-item';

    const temp = data.main.temp;  // 直接使用温度，不需要转换
    const feelsLike = data.main.feels_like;  // 直接使用温度，不需要转换
    
    cityItem.innerHTML = `
        <button class="remove-city" onclick="this.parentElement.remove()">×</button>
        <h4>${data.name}</h4>
        <img src="${getWeatherIconUrl(data.weather[0].icon)}" alt="天气图标" style="width: 50px;">
        <div class="city-temp">
            <p class="main-temp">${temp}°C</p>
            <p class="feels-like">体感温度: ${feelsLike}°C</p>
        </div>
        <div class="city-weather">
            <p>${data.weather[0].description}</p>
            <p>湿度: ${data.main.humidity}%</p>
            <p>风速: ${data.wind.speed} m/s</p>
            <p>气压: ${data.main.pressure} hPa</p>
        </div>
        <div class="city-advice">
            <p class="weather-mood">${getWeatherMood(data.weather[0].main, temp)}</p>
            <button class="toggle-tips" onclick="toggleClothingTips(this)">查看穿衣建议</button>
            <div class="clothing-tips" style="display: none;">
                ${getClothingAdvice(temp, data.weather[0].main)}
            </div>
        </div>
    `;

    cityList.appendChild(cityItem);
}

// 切换穿衣建议显示
function toggleClothingTips(button) {
    const tipsDiv = button.nextElementSibling;
    if (tipsDiv.style.display === 'none') {
        tipsDiv.style.display = 'block';
        button.textContent = '收起穿衣建议';
    } else {
        tipsDiv.style.display = 'none';
        button.textContent = '查看穿衣建议';
    }
}

// 搜索天气
async function searchWeather() {
    try {
        console.log('开始搜索天气...');
        const cityInput = document.getElementById('cityInput');
        const city = cityInput.value.trim();
        const weatherCard = document.querySelector('.weather-card');

        console.log('输入的城市名称:', city);

        if (!city) {
            alert('请输入城市名称');
            return;
        }

        // 添加加载状态
        weatherCard.classList.add('loading');
        
        // 清除之前的错误信息
        document.querySelector('.error-message')?.remove();

        const weatherData = await getWeatherData(city);
        if (weatherData) {
            updateCurrentWeather(weatherData);
            const forecastData = await getForecastData(city);
            updateForecast(forecastData);
        }
    } catch (error) {
        console.error('查询天气失败:', error);
        alert(`查询天气失败: ${error.message}`);
    } finally {
        document.querySelector('.weather-card')?.classList.remove('loading');
    }
}

// 页面加载完成后自动获取默认城市天气
document.addEventListener('DOMContentLoaded', () => {
    const defaultCity = '北京';
    const cityInput = document.getElementById('cityInput');
    const searchButton = document.getElementById('searchButton');
    const addCityButton = document.getElementById('addCityButton');

    if (cityInput) {
        cityInput.value = defaultCity;
        // 添加回车键搜索功能
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchWeather();
            }
        });
    }
    
    // 确保按钮存在后再添加事件监听
    if (searchButton) {
        searchButton.addEventListener('click', searchWeather);
    }
    
    if (addCityButton) {
        addCityButton.addEventListener('click', addCity);
    }
    
    // 初始加载默认城市天气
    searchWeather();
});

// 添加城市到对比
async function addCity() {
    const cityInput = document.getElementById('travelCityInput');
    const city = cityInput?.value.trim();

    if (!city) {
        alert('请输入城市名称');
        return;
    }

    const weatherData = await getWeatherData(city);
    if (weatherData) {
        addCityToComparison(weatherData);
        // 清空输入框
        cityInput.value = '';
    }
}

// Remove duplicate searchWeather function here

// 页面加载完成后自动获取默认城市天气
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成');
    const defaultCity = '北京';
    const searchInput = document.querySelector('#cityInput');
    const searchButton = document.querySelector('#searchButton');
    
    console.log('搜索按钮元素:', searchButton);
    
    if (searchInput) {
        console.log('找到输入框元素');
        searchInput.value = defaultCity;
        searchInput.addEventListener('keypress', (event) => {
            console.log('按下键盘:', event.key);
            if (event.key === 'Enter') {
                searchWeather();
            }
        });
    } else {
        console.log('未找到输入框元素');
    }
    
    if (searchButton) {
        console.log('找到搜索按钮，添加点击事件');
        searchButton.addEventListener('click', () => {
            console.log('搜索按钮被点击');
            searchWeather();
        });
    } else {
        console.error('未找到搜索按钮元素');
    }
    
    console.log('开始加载默认城市天气');
    searchWeather();
});

// 删除重复的 handleSearch 函数和全局绑定
// 删除以下代码：
// async function handleSearch() { ... }
// window.handleSearch = handleSearch;

// 处理搜索事件
async function handleSearch() {
    const cityInput = document.querySelector('input[type="text"]');
    const city = cityInput?.value.trim() || '北京';
    const weatherCard = document.querySelector('.weather-card');

    try {
        console.log('开始获取天气数据...');
        const weatherData = await getWeatherData(city);
        if (weatherData) {
            updateCurrentWeather(weatherData);
            const forecastData = await getForecastData(city);
            updateForecast(forecastData);
        }
    } catch (error) {
        console.error('查询天气失败:', error);
        alert('查询天气失败，请稍后重试');
    }
}

// 确保函数可以全局访问
window.handleSearch = handleSearch;
window.toggleClothingTips = toggleClothingTips;
