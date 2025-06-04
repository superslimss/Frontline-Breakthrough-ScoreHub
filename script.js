// 分数数据存储
let scores = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0
};

// 历史记录存储
let history = {
    level1: [],
    level2: [],
    level3: [],
    level4: [],
    level5: []
};

// 总分历史记录
let totalHistory = [];

// 图表实例
let historyChart = null;

// 保存数据到localStorage
function saveScores() {
    console.log('保存分数数据到localStorage');
    localStorage.setItem('frontlineScores', JSON.stringify(scores));
    localStorage.setItem('frontlineHistory', JSON.stringify(history));
}

// 从localStorage加载数据
function loadScores() {
    console.log('从localStorage加载分数数据');
    const savedScores = localStorage.getItem('frontlineScores');
    const savedHistory = localStorage.getItem('frontlineHistory');
    
    if (savedScores) {
        scores = JSON.parse(savedScores);
        // 更新输入框显示
        Object.keys(scores).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = scores[key] || '';
            }
        });
    }
    
    if (savedHistory) {
        history = JSON.parse(savedHistory);
    }
    
    // 更新统计信息
    updateTotalScore();
    updateStatistics();
}

// 记录总分历史
function addTotalHistory() {
    const timestamp = new Date().toLocaleString('zh-CN');
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    totalHistory.push({
        total: total,
        timestamp: timestamp
    });
    // 只保留最近20条记录
    if (totalHistory.length > 20) {
        totalHistory.shift();
    }
    localStorage.setItem('frontlineTotalHistory', JSON.stringify(totalHistory));
}

// 加载总分历史
function loadTotalHistory() {
    const saved = localStorage.getItem('frontlineTotalHistory');
    if (saved) {
        totalHistory = JSON.parse(saved);
    }
}

// 添加历史记录
function addHistoryRecord(levelId, score) {
    const timestamp = new Date().toLocaleString('zh-CN');
    history[levelId].push({
        score: score,
        timestamp: timestamp
    });
    // 只保留最近20条记录
    if (history[levelId].length > 20) {
        history[levelId].shift();
    }
    saveScores();
    addTotalHistory(); // 新增：同步记录总分历史
}

// ======= 优化Y轴最大值和步长算法 =======
function getNiceStepAndMax(val) {
    if (val <= 100) return { step: 20, max: 100 };
    if (val <= 500) return { step: 50, max: Math.ceil(val / 50) * 50 };
    if (val <= 1000) return { step: 100, max: Math.ceil(val / 100) * 100 };
    if (val <= 2500) return { step: 250, max: Math.ceil(val / 250) * 250 };
    if (val <= 5000) return { step: 500, max: Math.ceil(val / 500) * 500 };
    if (val <= 10000) return { step: 1000, max: Math.ceil(val / 1000) * 1000 };
    if (val <= 20000) return { step: 2000, max: Math.ceil(val / 2000) * 2000 };
    return { step: 5000, max: Math.ceil(val / 5000) * 5000 };
}

// 显示历史记录图表
function showHistoryChart(levelId) {
    const modal = document.getElementById('historyModal');
    const modalTitle = document.getElementById('modalTitle');
    const levelName = `第${levelId.replace('level', '')}关卡`;
    modalTitle.textContent = `${levelName}历史记录`;
    
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    // 准备数据，过滤掉0值记录
    const historyData = history[levelId].filter(record => record.score > 0);
    const labels = historyData.map(record => record.timestamp);
    const scores = historyData.map(record => record.score);
    
    // 如果已存在图表，先销毁
    if (historyChart) {
        historyChart.destroy();
    }
    
    // 计算Y轴范围
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreRange = maxScore - minScore;
    const padding = scoreRange * 0.2; // 上下各留20%的padding

    // 优化后的整齐Y轴最大值和步长
    let { step, max: niceMax } = getNiceStepAndMax(maxScore);
    niceMax = niceMax + 2 * step;
    
    // 创建新图表
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '分数',
                data: scores,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ff6b6b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointStyle: 'circle'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${levelName}分数变化趋势`,
                    font: {
                        size: 18
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        label: function(context) {
                            return `分数: ${context.raw}`;
                        },
                        afterBody: function(context) {
                            const index = context[0].dataIndex;
                            return [
                                '',
                                '右键数据点可删除该记录'
                            ];
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    min: Math.max(0, minScore - padding),
                    max: niceMax,
                    title: {
                        display: true,
                        text: '分数',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '时间',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    
    // 右键删除数据点
    const chartCanvas = document.getElementById('historyChart');
    chartCanvas.oncontextmenu = function(e) {
        e.preventDefault();
        if (!historyChart) return false;
        const points = historyChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
        if (points && points.length > 0) {
            const index = points[0].index;
            if (confirm('确定要删除这条记录吗？')) {
                history[levelId].splice(index, 1);
                rebuildTotalHistoryFromAllLevels(); // 新增：同步重建总分历史
                showHistoryChart(levelId);
                saveScores();
            }
        }
        return false;
    };
    
    modal.style.display = 'block';
}

// 显示总分历史统计图
function showTotalHistoryChart() {
    const modal = document.getElementById('historyModal');
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = `总分历史记录`;
    const ctx = document.getElementById('historyChart').getContext('2d');
    // 数据
    const historyData = totalHistory;
    const labels = historyData.map(record => record.timestamp);
    const totals = historyData.map(record => record.total);
    // 销毁旧图表
    if (historyChart) historyChart.destroy();
    // 计算Y轴范围
    const maxScore = Math.max(...totals);
    const minScore = Math.min(...totals);
    const scoreRange = maxScore - minScore;
    const padding = scoreRange * 0.2;
    // 优化后的整齐Y轴最大值和步长
    let { step, max: niceMax } = getNiceStepAndMax(maxScore);
    niceMax = niceMax + 2 * step;
    // 创建新图表（不允许右键删除）
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '总分',
                data: totals,
                borderColor: '#0984e3',
                backgroundColor: 'rgba(9,132,227,0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#0984e3',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointStyle: 'circle'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `总分变化趋势`,
                    font: { size: 18 }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 14 },
                    callbacks: {
                        label: function(context) {
                            return `总分: ${context.raw}`;
                        },
                        afterBody: function(context) {
                            return ['','此图表不支持右键删除'];
                        }
                    }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    min: Math.max(0, minScore - padding),
                    max: niceMax,
                    title: { display: true, text: '总分', font: { size: 14 } },
                    ticks: { font: { size: 12 } }
                },
                x: {
                    title: { display: true, text: '时间', font: { size: 14 } },
                    ticks: { font: { size: 12 }, maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
    // 禁用右键删除
    const chartCanvas = document.getElementById('historyChart');
    chartCanvas.oncontextmenu = function(e) { e.preventDefault(); return false; };
    modal.style.display = 'block';
}

// 关闭历史记录弹窗
function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    modal.style.display = 'none';
    if (historyChart) {
        historyChart.destroy();
        historyChart = null;
    }
}

// 初始化事件监听器
function initializeEventListeners() {
    console.log('初始化事件监听器...');
    
    // 绑定输入框事件
    const inputs = document.querySelectorAll('.score-input');
    inputs.forEach(input => {
        input.addEventListener('blur', handleScoreBlur);
        input.addEventListener('focus', handleInputFocus);
    });

    // 绑定历史记录图标点击事件
    const historyIcons = document.querySelectorAll('.history-icon');
    historyIcons.forEach(icon => {
        icon.addEventListener('click', (event) => {
            event.stopPropagation();
            const levelCard = icon.closest('.level-card');
            const levelId = `level${levelCard.dataset.level}`;
            showHistoryChart(levelId);
        });
    });

    // 绑定弹窗关闭按钮事件
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeHistoryModal);
    }

    // 点击弹窗外部关闭
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('historyModal'); // 历史记录弹窗
        const producerModal = document.getElementById('producerModal'); // 制作人弹窗
        const guideModal = document.getElementById('guideModal'); // 游戏攻略主弹窗
        const clickedElement = event.target; // 获取点击的元素

        // 如果点击的是攻略内容弹窗的外部
        if (clickedElement.classList.contains('guide-content-modal')) {
            clickedElement.style.display = 'none'; // 隐藏当前内容弹窗
            guideModal.style.display = 'block'; // 显示游戏攻略主弹窗
        } else if (clickedElement === modal) { // 如果点击的是历史记录弹窗外部
            closeHistoryModal();
        } else if (clickedElement === producerModal) { // 如果点击的是制作人弹窗外部
            producerModal.style.display = 'none';
        } else if (clickedElement === guideModal) { // 如果点击的是游戏攻略主弹窗外部
            guideModal.style.display = 'none';
        }
    });

    // 绑定按钮事件
    const clearBtn = document.getElementById('clearBtn');
    const randomBtn = document.getElementById('randomBtn');
    const exportBtn = document.getElementById('exportBtn');
    const guideBtn = document.getElementById('guideBtn'); // 新增：游戏攻略按钮

    if (clearBtn) {
        console.log('绑定清空按钮事件');
        clearBtn.addEventListener('click', clearAllScores);
    } else {
        console.error('找不到清空按钮');
    }

    if (randomBtn) {
        console.log('绑定随机填充按钮事件');
        randomBtn.addEventListener('click', fillRandomScores);
    } else {
        console.error('找不到随机填充按钮');
    }

    if (exportBtn) {
        console.log('绑定导出按钮事件');
        exportBtn.addEventListener('click', exportData);
    } else {
        console.error('找不到导出按钮');
    }

    // 新增游戏攻略按钮事件
    if (guideBtn) {
        console.log('绑定游戏攻略按钮事件');
        guideBtn.addEventListener('click', function() {
            const guideModal = document.getElementById('guideModal');
            const guideSectionList = document.getElementById('guideSectionList');
            const heroEquipmentContent = document.getElementById('heroEquipmentContent');
            const shopItemsContent = document.getElementById('shopItemsContent'); // 获取商店道具内容div
            const guideModalTitle = document.getElementById('guideModalTitle');
            if (guideModal) {
                guideModal.style.display = 'block';
                // 默认显示板块列表
                if (guideSectionList) guideSectionList.style.display = 'block';
                if (heroEquipmentContent) heroEquipmentContent.style.display = 'none';
                if (shopItemsContent) shopItemsContent.style.display = 'none'; // 默认隐藏商店道具内容
            }
        });
    }

    // 新增：游戏攻略板块链接点击事件
    const guideSectionLinks = document.querySelectorAll('.guide-section-link');
    guideSectionLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.dataset.section;
            const guideSectionList = document.getElementById('guideSectionList');
            const heroEquipmentContent = document.getElementById('heroEquipmentContent');
            const shopItemsContent = document.getElementById('shopItemsContent'); // 获取商店道具内容div
            const guideModalTitle = document.getElementById('guideModalTitle');

            if (section === 'hero-equipment') {
                if (guideSectionList) guideSectionList.style.display = 'none';
                if (heroEquipmentContent) heroEquipmentContent.style.display = 'block';
                if (shopItemsContent) shopItemsContent.style.display = 'none'; // 隐藏商店道具内容
                if (guideModalTitle) guideModalTitle.textContent = '英雄装备'; // 更新弹窗标题
            } else if (section === 'shop-items') { // 新增：商店道具板块点击逻辑
                if (guideSectionList) guideSectionList.style.display = 'none';
                if (heroEquipmentContent) heroEquipmentContent.style.display = 'none'; // 隐藏英雄装备内容
                if (shopItemsContent) shopItemsContent.style.display = 'block';
                if (guideModalTitle) guideModalTitle.textContent = '商店道具'; // 更新弹窗标题
            }
            // 未来可以在这里添加其他板块的逻辑
        });
    });

    // 新增：游戏攻略返回按钮点击事件
    const guideBackBtn = document.getElementById('guideBackBtn'); // 英雄装备返回按钮
    const shopItemsBackBtn = document.getElementById('shopItemsBackBtn'); // 商店道具返回按钮

    if (guideBackBtn) {
        guideBackBtn.addEventListener('click', function() {
            const guideSectionList = document.getElementById('guideSectionList');
            const heroEquipmentContent = document.getElementById('heroEquipmentContent');
            const shopItemsContent = document.getElementById('shopItemsContent'); // 获取商店道具内容div
            const guideModalTitle = document.getElementById('guideModalTitle');

            if (guideSectionList) guideSectionList.style.display = 'block';
            if (heroEquipmentContent) heroEquipmentContent.style.display = 'none';
            if (shopItemsContent) shopItemsContent.style.display = 'none'; // 隐藏商店道具内容
            if (guideModalTitle) guideModalTitle.textContent = '游戏攻略'; // 恢复弹窗标题
        });
    }

    // 新增：商店道具返回按钮点击事件
    if (shopItemsBackBtn) {
        shopItemsBackBtn.addEventListener('click', function() {
            const guideSectionList = document.getElementById('guideSectionList');
            const heroEquipmentContent = document.getElementById('heroEquipmentContent'); // 获取英雄装备内容div
            const shopItemsContent = document.getElementById('shopItemsContent');
            const guideModalTitle = document.getElementById('guideModalTitle');

            if (guideSectionList) guideSectionList.style.display = 'block';
            if (heroEquipmentContent) heroEquipmentContent.style.display = 'none'; // 隐藏英雄装备内容
            if (shopItemsContent) shopItemsContent.style.display = 'none';
            if (guideModalTitle) guideModalTitle.textContent = '游戏攻略'; // 恢复弹窗标题
        });
    }

    // 新增教学按钮事件
    const teachBtn = document.getElementById('teachBtn');
    if (teachBtn) {
        teachBtn.addEventListener('click', function() {
            window.open('https://www.youtube.com/@BBSFrontlineBT', '_blank');
        });
    }

    // 添加键盘快捷键
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey) {
            switch(event.key) {
                case 'r':
                    event.preventDefault();
                    console.log('触发随机填充快捷键');
                    fillRandomScores();
                    break;
                case 'd':
                    event.preventDefault();
                    console.log('触发清空快捷键');
                    clearAllScores();
                    break;
                case 's':
                    event.preventDefault();
                    console.log('触发导出快捷键');
                    exportData();
                    break;
            }
        }
    });

    // 绑定总分卡片点击事件
    const totalScoreCard = document.getElementById('totalScoreCard');
    if (totalScoreCard) {
        totalScoreCard.addEventListener('click', showTotalHistoryChart);
    }
}

// 处理输入框失去焦点
function handleScoreBlur(event) {
    console.log('处理分数输入完成:', event.target.id);
    const levelId = event.target.id;
    const value = parseFloat(event.target.value) || 0;
    
    // 确保分数不为负数
    if (value < 0) {
        event.target.value = 0;
        scores[levelId] = 0;
    } else {
        // 只有当新值不为0且与旧值不同时才记录历史
        if (value !== 0 && value !== scores[levelId]) {
            scores[levelId] = value;
            addHistoryRecord(levelId, value);
        } else {
            scores[levelId] = value;
        }
    }
    
    updateTotalScore();
    updateStatistics();
    saveScores();
    
    // 添加动画效果
    const totalScoreElement = document.getElementById('totalScore');
    totalScoreElement.classList.add('score-updated');
    setTimeout(() => {
        totalScoreElement.classList.remove('score-updated');
    }, 300);
}

// 输入框获得焦点时的处理
function handleInputFocus(event) {
    event.target.style.transform = 'scale(1.02)';
}

// 更新总分数
function updateTotalScore() {
    console.log('更新总分数');
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const average = total / 5;
    
    const totalScoreElement = document.getElementById('totalScore');
    const averageScoreElement = document.getElementById('averageScore');
    
    if (totalScoreElement) {
        totalScoreElement.textContent = total.toFixed(1);
    }
    if (averageScoreElement) {
        averageScoreElement.textContent = average.toFixed(1);
    }
}

// 更新统计信息
function updateStatistics() {
    console.log('更新统计信息');
    const scoreValues = Object.values(scores).filter(score => score > 0);
    const allScores = Object.values(scores);
    
    // 最高分
    const maxScore = Math.max(...allScores);
    const maxScoreElement = document.getElementById('maxScore');
    if (maxScoreElement) {
        maxScoreElement.textContent = maxScore.toFixed(1);
    }
    
    // 最低分（只考虑大于0的分数）
    const minScore = scoreValues.length > 0 ? Math.min(...scoreValues) : 0;
    const minScoreElement = document.getElementById('minScore');
    if (minScoreElement) {
        minScoreElement.textContent = minScore.toFixed(1);
    }
    
    // 已完成关卡数
    const completedLevels = scoreValues.length;
    const completedLevelsElement = document.getElementById('completedLevels');
    if (completedLevelsElement) {
        completedLevelsElement.textContent = completedLevels;
    }
    
    // 分数跨度
    const scoreRange = maxScore - (minScore > 0 ? minScore : maxScore);
    const scoreRangeElement = document.getElementById('scoreRange');
    if (scoreRangeElement) {
        scoreRangeElement.textContent = scoreRange.toFixed(1);
    }
}

// 清空所有分数
function clearAllScores() {
    console.log('清空按钮被点击');
    if (confirm('确定要清空所有分数吗？\n注意：这将同时清空历史记录！')) {
        Object.keys(scores).forEach(key => {
            scores[key] = 0;
            history[key] = []; // 清空历史记录
            const input = document.getElementById(key);
            if (input) {
                input.value = '';
            }
        });
        totalHistory = []; // 清空总分历史
        localStorage.setItem('frontlineTotalHistory', JSON.stringify([])); // 同步清空本地存储
        updateTotalScore();
        updateStatistics();
        saveScores();
        
        // 添加清空动画效果
        const container = document.querySelector('.container');
        if (container) {
            container.style.animation = 'fadeIn 0.5s ease-in';
        }
        alert('所有分数和历史记录已清空！');
    }
}

// 随机填充分数
function fillRandomScores() {
    console.log('随机填充按钮被点击');
    if (confirm('确定要用随机分数填充所有关卡吗？')) {
        Object.keys(scores).forEach(key => {
            const randomScore = Math.floor(Math.random() * 1000) + 100; // 100-1099的随机分数
            scores[key] = randomScore;
            const input = document.getElementById(key);
            if (input) {
                input.value = randomScore;
            }
            // 记录到历史
            addHistoryRecord(key, randomScore);
        });
        updateTotalScore();
        updateStatistics();
        saveScores(); // 保存随机填充的数据
        alert('随机分数填充完成！');
    }
}

// 导出数据
function exportData() {
    console.log('导出按钮被点击');
    try {
        const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
        const average = (total / 5).toFixed(2);
        const currentTime = new Date().toLocaleString('zh-CN');
        
        // 构建纯文本格式的数据
        const textContent = `前线突围活动分数统计
==================
第一关：${scores.level1}分
第二关：${scores.level2}分
第三关：${scores.level3}分
第四关：${scores.level4}分
第五关：${scores.level5}分
------------------
总分：${total}分
平均分：${average}分
导出时间：${currentTime}
==================`;

        // 创建文本文件并下载
        const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `前线突围分数统计_${new Date().toISOString().split('T')[0]}.txt`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('数据导出成功！');
    } catch (error) {
        console.error('导出数据时出错:', error);
        alert('数据导出失败，请重试！');
    }
}

// 重新生成总分历史，保证与关卡历史同步，且每个时间点为所有关卡"最近一次分数"之和
function rebuildTotalHistoryFromAllLevels() {
    // 取所有关卡历史的时间戳集合
    let allTimestamps = new Set();
    Object.values(history).forEach(arr => arr.forEach(r => allTimestamps.add(r.timestamp)));
    // 按时间排序
    let sortedTimestamps = Array.from(allTimestamps).sort();
    // 生成新的总分历史
    let newTotalHistory = [];
    // 记录每个关卡的"最近一次分数"
    let lastScore = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 };
    sortedTimestamps.forEach(ts => {
        Object.keys(history).forEach(level => {
            // 找到该关卡在该时间点的分数（如果有）
            let rec = history[level].find(r => r.timestamp === ts);
            if (rec) lastScore[level] = rec.score;
        });
        // 该时间点的总分为所有关卡"最近一次分数"之和
        let total = Object.values(lastScore).reduce((sum, v) => sum + v, 0);
        newTotalHistory.push({ total, timestamp: ts });
    });
    // 最多保留20条
    if (newTotalHistory.length > 20) newTotalHistory = newTotalHistory.slice(-20);
    totalHistory = newTotalHistory;
    localStorage.setItem('frontlineTotalHistory', JSON.stringify(totalHistory));
}

// 显示攻略内容弹窗
function showGuideContent(modalId) {
    // 关闭游戏攻略主弹窗
    document.getElementById('guideModal').style.display = 'none';
    // 显示对应的内容弹窗
    document.getElementById(modalId).style.display = 'block';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化');
    loadScores(); // 加载保存的数据
    loadTotalHistory(); // 加载总分历史
    initializeEventListeners();
    updateTotalScore();
    updateStatistics();
    // 绑定总分卡片点击事件
    const totalScoreCard = document.getElementById('totalScoreCard');
    if (totalScoreCard) {
        totalScoreCard.addEventListener('click', showTotalHistoryChart);
    }

    // ====== 制作人弹窗绑定逻辑 ====== // 移除错误的关闭按钮绑定，保留打开按钮绑定和外部点击关闭
    const producerBtn = document.getElementById('producerBtn');
    const producerModal = document.getElementById('producerModal');

    // 确保制作人按钮的点击事件能正确绑定
    if (producerBtn && producerModal) {
        producerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            producerModal.style.display = 'block';
        });
    }

    // 制作人弹窗的关闭通过内联 onclick 和 window 外部点击处理

    // ====== END 制作人弹窗绑定 ======
});