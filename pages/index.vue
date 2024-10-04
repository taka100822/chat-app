<template>
  <v-row class="h-full items-center">
    <v-col class="flex justify-center">
      <v-card class="p-8 space-y-8 justify-center text-center" width="600">
        <!-- メールアドレス -->
        <v-text-field
          v-model="email"
          type="email"
          label="メールアドレス"
          outlined
          dense
          hide-details
        ></v-text-field>

        <!-- パスワード -->
        <v-text-field
          v-model="password"
          type="password"
          label="パスワード"
          outlined
          dense
          hide-details
        ></v-text-field>

        <!-- ログインボタン -->
        <v-btn
          color="primary"
          elevation="0"
          block
          :disabled="!(email && password)"
          @click="login"
        >
          ログイン
        </v-btn>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

export default {
  name: 'IndexPage',
  data: () => ({
    // メールアドレス
    email: '',

    // パスワード
    password: '',
  }),
  methods: {
    // ログイン
    async login() {
      try {
        await signInWithEmailAndPassword(getAuth(), this.email, this.password)

        this.$router.push('/chat')
      } catch (error) {
        alert('メールアドレスまたはパスワードが正しくありません')
      }
    },
  },
}
</script>