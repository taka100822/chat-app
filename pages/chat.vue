<template>
  <div class="h-full flex flex-col gap-2 px-2" style="font-family: 'Roboto', sans-serif;">
    <div class="grow basis-0 overflow-y-scroll space-y-4">
      <div v-for="(mess, index) in messages" :key="mess.id">
        <!-- 日付ラベルの挿入 -->
        <div v-if="checkDateChanged(index)" class="flex justify-center">
          <div class="text-center text-sm bg-blue-500 text-white py-1 px-4 rounded-full mt-4 inline-block">
            {{ getDividerDateLabel(mess.created) }}
          </div>
        </div>


        <div class="flex items-start gap-2" :class="{ 'justify-end': isMe(mess.uid), 'justify-start': !isMe(mess.uid) }">
          <!-- アイコン -->
          <div v-if="!isMe(mess.uid)" class="w-10 h-10 relative blue rounded-full items-center mt-2">
            <div class="ml-3 mt-2 text-white">{{ getUserFirstLetterOfNameById(mess.uid) }}</div>
          </div>

          <div class="max-w-md">
            <div class="flex items-center">
              <!-- 名前の表示 -->
              <div v-if="!isMe(mess.uid)" class="text-sm">
                {{ getUserNameById(mess.uid) }}
              </div>

              <!-- 時刻の表示 -->
              <div class="text-sm ml-2 text-gray-400">
                {{ mess.created.toDate().getHours() }}:{{ mess.created.toDate().getMinutes() }}
              </div>

              <!-- 既読数の表示 -->
              <div v-if="isMe(mess.uid)" class="ml-4 text-xs text-gray-500">
                既読 0
              </div>

              <!-- 削除アイコン -->
              <v-tooltip top>
                <template #activator="{ on, attrs }">
                  <v-icon
                    v-if="isMe(mess.uid)"
                    class="ml-2"
                    v-bind="attrs"
                    v-on="on"
                    @click="deleteMessage(mess.id)"
                  >
                    mdi-delete
                  </v-icon>
                </template>
                <div class="text-white font-semibold rounded">削除</div>
              </v-tooltip>
            </div>

            <!-- メッセージ -->
            <div class="p-2 relative rounded-lg mt-1 inline-block" :class="{ 'ml-16 text-right bg-blue-50': isMe(mess.uid), 'ml-2 text-left bg-gray-100': !isMe(mess.uid) }">
              {{ mess.message }}
              <div v-if="!isMe(mess.uid)" class="absolute top-1/3 left-0 transform -translate-x-full -translate-y-1/2 border-l-8 border-l-transparent border-t-8 border-t-green-50"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="flex items-center gap-2">
        <!-- メッセージ入力 -->
        <v-textarea
          v-model="inputMessage"
          rows="1"
          auto-grow
          outlined
          dense
          hide-details
        >
        </v-textarea>

        <!-- 送信ボタン -->
        <v-btn
          color="primary"
          height="40"
          elevation="0"
          :disabled="!inputMessage"
          @click="postMessage"
        >
          送信
        </v-btn>
      </div>
    </div>
  </div>
</template>


    <!-- メッセージ入力・送信 -->
    <div class="bg-green-100">
      <div class="flex items-center gap-2">
        <!-- メッセージ入力 -->
        <v-textarea
          v-model="inputMessage"
          rows="1"
          auto-grow
          outlined
          dense
          hide-details
        >
        </v-textarea>

        <!-- 送信ボタン -->
        <v-btn
          color="primary"
          height="40"
          elevation="0"
          :disabled="!inputMessage"
          @click="postMessage"
        >
          送信
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { onAuthStateChanged, getAuth } from 'firebase/auth'
import {
  collection,
  getDocs,
  deleteDoc,
  getFirestore,
  query,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  startAfter,
  doc,
} from 'firebase/firestore'

export default {
  name: 'ChatPage',
  data: () => ({
    // データベース
    db: null,

    // 自身の UID
    uid: null,

    // メッセージ
    messages: [],

    // ユーザー
    users: [],

    // 最新のメッセージ
    latestMessageDoc: null,

    // 入力メッセージ
    inputMessage: '',
  }),
  mounted() {
    // UID を取得しメッセージを読み込む
    const auth = getAuth()

    onAuthStateChanged(auth, (user) => {
      // UID を設定
      if (user) {
        this.uid = user.uid
      } else {
        this.$router.push('/')
      }

      // メッセージを取得
      this.db = getFirestore()
      this.getMessages()
      this.getUsers()
    })
  },
  destroyed() {
    // メッセージを購読解除
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  methods: {
    // メッセージを取得
    async getMessages() {
      const { docs = [] } = await getDocs(
        query(collection(this.db, 'messages'), orderBy('created', 'asc'))
      )

      docs.forEach((doc) => {
        this.messages.push({ id: doc.id, ...doc.data() })
      })

      // 最新のメッセージを保持
      if (docs.length > 0) {
        this.latestMessageDoc = docs[docs.length - 1]
      }

      // メッセージを購読
      this.subscribeMessage()
    },

    // メッセージを購読
    subscribeMessage() {
      return onSnapshot(
        query(
          collection(this.db, 'messages'),
          orderBy('created', 'asc'),
          startAfter(this.latestMessageDoc)
        ),
        (snapshot) => {
          snapshot.docChanges().forEach((docChange) => {
            const { doc, type } = docChange

            switch (type) {
              // メッセージ追加
              case 'added':
                this.messages.push({
                  id: doc.id,
                  ...doc.data({ serverTimestamps: 'estimate' }),
                })
                break
            }
          })
        }
      )
    },

    // メッセージを送信
    async postMessage() {
      await addDoc(collection(this.db, 'messages'), {
        uid: this.uid,
        message: this.inputMessage,
        created: serverTimestamp(),
      })

      // 入力メッセージをクリア
      this.inputMessage = ''
    },

    // メッセージの削除
    async deleteMessage(uid) {
      // Firestore のドキュメントを参照
      const docRef = doc(this.db, "messages", uid);

      // ドキュメントを削除
      await deleteDoc(docRef);
      // ローカルの messages 配列からも削除する場合
      this.messages = this.messages.filter(message => message.id !== uid);
    },

    // 自身のメッセージかチェック
    isMe(uid) {
      if(uid === this.uid){
        return true
      }
      else{
        return false
      }
    },

    // ユーザー情報を取得
    async getUsers() {
      const { docs = [] } = await getDocs(
        query(collection(this.db, 'users'))
      )

      docs.forEach((doc) => {
        this.users.push({ id: doc.id, ...doc.data() })
      })
    },

    getUserNameById(userId) {
      for (const user of this.users){
        if(user.id === userId){
          return user.name;
        }
      }
      return null
    },

    getUserFirstLetterOfNameById(userId) {
      for (const user of this.users){
        if(user.id === userId){
          return user.first_letter;
        }
      }
      return null
    },

    // 日付が変わったか確認
    checkDateChanged(index) {
      if (index === 0) return true; // 最初のメッセージは必ず表示
      const currentMessageDate = this.messages[index].created.toDate().toLocaleDateString();
      const previousMessageDate = this.messages[index - 1].created.toDate().toLocaleDateString();
      return currentMessageDate !== previousMessageDate;
    },

    // 日付を取得
    getDividerDateLabel(timestamp) {
      const date = timestamp.toDate();
    const today = new Date();

    // 今日の日付を比較
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    // 昨日の日付を比較
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear();

    // 日付ラベルの決定
    if (isToday) {
      return '今日';
    } else if (isYesterday) {
      return '昨日';
    } else {
      return `${date.getMonth() + 1}/${date.getDate()} (${this.getDayLabel(date.getDay())})`;
    }
  },
  getDayLabel(day) {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[day];
  }
  }
}
</script>
