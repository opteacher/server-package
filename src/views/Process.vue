<template>
<div style="position: fixed; top: 10px; left: 10px; bottom: 10px; right: 10px; overflow: auto">
  <div style="width: 100000px; height: 100000px">
    <a-card size="small" title="Small size card" style="position: relative; top: 100px; left: 100px; width: 300px">
      <template #extra><a href="#">more</a></template>
      <p>card content</p>
      <p>card content</p>
      <p>card content</p>
    </a-card>



    <a-card size="small" title="Small size card" style="position: relative; top: 500px; left: 100px; width: 300px">
      <template #extra><a href="#">more</a></template>
      <p>card content</p>
      <p>card content</p>
      <p>card content</p>
    </a-card>

    <svg style="position: absolute; top: 0; left: 0; width: 100000px; height: 100000px">
      <line stroke-width="1" stroke="#f0f0f0" x1="150" y1="150" x2="150" y2="450"/>
    </svg>
  </div>
</div>
</template>

<style lang="less">
// 1px solid #f0f0f0
</style>
