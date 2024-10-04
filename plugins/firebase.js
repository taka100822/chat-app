import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    projectId: 'chat-app-0924',
    apiKey: 'AIzaSyC1rEbYjgzhDAjOodhxXVY56vOXZtv0JKQ',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)