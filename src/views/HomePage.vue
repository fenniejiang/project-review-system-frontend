<template>
    <header class="headroom">
       <div class="zhuban">
            <img src="@/assets/hold.png" class="header-img">
       </div>
    </header>
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6">
                <div class="repair-banner-content">
                    <h1>专家评审系统</h1>
                    <span class="sub-title"></span>
                    <p>
                        为做好中央财政支持的“专精特新”小巨人企业（重点小巨人）评审工作，结合前期重点小巨人评审经验，工业和信息化部产业发展促进中心拟建设重点小巨人专家评审系统，全面提升专家评审及结果汇总效率。
                    </p>
                    <a href="/login" class="btn btn-primary">用户登录</a>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="repair-banner-image">
                    <img src="@/assets/qie1.png"  alt="image" class="top-image">
                    <img src="@/assets/1.png" alt="image" class="middle-image">
                    <img src="@/assets/2.png" alt="image" class="bottom-image">
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
</script>

<style scoped lang="less">
/* 设置 html 和 body 的背景颜色为白色 */
html, body {
    background-color: white;
    margin: 0;
    padding: 0;
}

.top-image {
    z-index: 3; /* 设置最上层图片的层级 */
}

.middle-image {
    z-index: 2; /* 设置中间层图片的层级 */
}

.bottom-image {
    z-index: 1; /* 设置最下层图片的层级 */
}

.bg-eef6fd {
    background-color: #eef6fd;
}

.row-cols-lg-6>* {
    flex: 0 0 auto;
    width: 16.6666666667%
}

.repair-banner-content p {
    margin-bottom: 30px;
}

p {
    color: #6084a4;
    line-height: 1.9;
}

.align-items-center {
    align-items: center !important;
}

.row {
    --bs-gutter-x: 1.5rem;
    --bs-gutter-y: 0;
    display: flex;
    flex-wrap: wrap;
    /* 修正负外边距问题 */
    margin-right: calc(-0.5 * var(--bs-gutter-x));
    margin-left: calc(-0.5 * var(--bs-gutter-x));
}

.row>* {
    flex-shrink: 0;
    width: 100%;
    max-width: 100%;
    padding-right: calc(var(--bs-gutter-x) * .5);
    padding-left: calc(var(--bs-gutter-x) * .5);
    margin-top: var(--bs-gutter-y)
}

img,
svg {
    vertical-align: middle;
}

.container {
    max-width: 1140px;
    /* 给 container 添加内边距 */
    padding-right: 15px;
    padding-left: 15px;
    margin-right: auto;
    margin-left: auto;
    margin-top: 20px;
}

.headroom {
    height: 80px;
    position: relative;
}

.zhuban {
    position: absolute;
    top: 20px;
    left: 300px; /* 和 container 的左内边距保持一致 */
}

.header-img {
    height: 60px; /* 根据需要调整图片高度 */
    width: auto;
    vertical-align: middle;
}

@media (min-width: 992px) {
    .col-lg-6 {
        flex: 0 0 auto;
        width: 50%;
    }
}

.repair-banner-content .btn {
  display: inline-block;
  width: 120px;
  padding: 10px 20px;
  font-size: 18px;
}

.container,
.container-fluid,
.container-lg,
.container-md,
.container-sm,
.container-xl,
.container-xxl {
    width: 100%;
    padding-right: var(--bs-gutter-x, .75rem);
    padding-left: var(--bs-gutter-x, .75rem);
    margin-right: auto;
    margin-left: auto;
}

.repair-banner-image {
    position: relative;
    width: 100%;
    height: 600px; /* 和左侧内容同高 */
    display: flex;
    align-items: center;
    justify-content: center;
}

.repair-banner-image img {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80%;   /* 图片尺寸根据需要调节 */
    height: auto;
    transform: translate(-50%, -50%);
}

.top-image {
    z-index: 3;
}

.middle-image {
    z-index: 2;
}

.bottom-image {
    z-index: 1;
}

.repair-banner-content {
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 400px; /* 和右侧图片容器高度一致 */
}

.repair-banner-content h1 {
    margin-bottom: 20px;
    font-size: 45px;
    font-weight: 500;

}

.repair-banner-content p {
    max-width: 80%;
}

@media (max-width: 992px) {
    .repair-banner-image {
        height: 300px;
    }
    .repair-banner-content {
        height: auto;
        margin-bottom: 30px;
    }
}

.repair-banner-content  {
    text-align: left; /* 确保标题左对齐 */

}

.repair-banner-content h1 {
    text-align: left; /* 确保标题左对齐 */
    margin-bottom: 20px; /* 增加标题间距 */
}

.repair-banner-content p {
    text-align: left; /* 确保段落左对齐 */
    max-width: 80%; /* 限制段落宽度 */
}
</style>