import { writable } from 'svelte/store';
import { routerStore } from '../stores/router-store.js'
import { authStore } from '../stores/auth-store.js'
import { timesStoreChangeDuration } from '../stores/times-store.js'

export const userStore = writable({
	termsAccepted: 0,
	stopwatchEntryId: null,
	stopwatchStartTime: 0,
})

let listener

export function userStoreInit() {
	setListener()
}

function setListener() {
	authStore.subscribe(authData => {
		if(listener) {
			listener()
		}

		if(authData.hasAuth) {
			listener = firebase.db.collection('users').doc(authData.user.id).onSnapshot(snapshot => {
		
				if(snapshot.data()) {
					let userStoreUnsubscribe = userStore.subscribe(userData => {
						if(JSON.stringify(snapshot.data()) != JSON.stringify(userData)) {
							userStore.update(data => snapshot.data())
						}
					})
					userStoreUnsubscribe()
				} else {
					updateUser()
				}
			})
		}
	})
}


export function updateUser() {
	let unsubscribe = authStore.subscribe(authData => {
		if(authData.hasAuth) {
			let unsubscribeUser = userStore.subscribe(userData =>
				firebase.db.collection('users').doc(authData.user.id).set(userData).then(res => {
					console.log('updateUser', res)
				}).catch(err => {
					console.log(err)
				})
			)
			unsubscribeUser()
		}
	})
	unsubscribe()
}


export function userSetStopwatch(id, startTime) {

	userStore.update(data => {
		if(data.stopwatchEntryId) {
			timesStoreChangeDuration(data.stopwatchEntryId, (Math.floor((Date.now()  - data.stopwatchStartTime) / 1000)))
		}
		
		if(data.stopwatchEntryId != id || !data.stopwatchEntryId) {
			data.stopwatchEntryId = id
			data.stopwatchStartTime = startTime
		} else {
			data.stopwatchEntryId = null
			data.stopwatchStartTime = 0
		}


		return data
	})

	updateUser()
}