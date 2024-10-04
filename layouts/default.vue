<template>
  <v-app dark>
    <v-main>
      <v-container class="h-full">
        <Nuxt />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'DefaultLayout',
}
</script>

<style>
html {
  overflow-y: auto;
}

div::-webkit-scrollbar {
  width: 10px;
  background-color: white;
}

div::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background-color: #dadce0;
  border: 2px solid rgba(0, 0, 0, 0);
  background-clip: content-box;
}
</style>