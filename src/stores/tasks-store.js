import { writable, get } from 'svelte/store'
import { authStore } from '../stores/auth-store.js'
import { teamStore } from '../stores/team-store.js'
import { COLORS } from '../helpers/helpers.js'

export const tasksStore = writable({
	json: {},
	array: []
})

let listener


export function tasksStoreInit() {
	setListener()

}

function setListener() {
	teamStore.subscribe(teamData => {
		if(listener) {
			listener()
		}

		if(teamData.active) {
			listener = firebase.db.collection('tasks').where('team', '==', teamData.active.id).onSnapshot(snapshot =>
				snapshot.docChanges().forEach(change => {
								
					if (change.type === 'added' || change.type === 'modified') {

						const entryData = Object.assign({ 
							id: change.doc.id 
						}, change.doc.data())

						tasksStore.update(data => {
							data.json[entryData.id] = entryData
							data.array = (Object.keys(data.json).map(el => data.json[el])).sort((a, b) => a.title.localeCompare(b.title))
							return data
						})
					} else if (change.type === 'removed') {
						tasksStore.update(data => {
							delete data.json[change.doc.id]
							data.array = (Object.keys(data.json).map(el => data.json[el])).sort((a, b) => a.title.localeCompare(b.title))
							return data
						})
					}
				})
			)
		}
	})
}


export function tasksStoreNewTask(cb) {

	const { user } = get(authStore),
		{ active } = get(teamStore)

	firebase.db.collection('tasks').doc().set({
		user: user.id,
		team: active.id,
		title: '',
		project: null,
		color: COLORS[Math.floor(Math.random() * COLORS.length)],
		updated: new Date(),
		created: new Date()
	}).then(() => {
		console.log('document created');
		cb(true)
	}).catch(err => {
		console.error('error: ', err);
		cb(false)
	})
}


export function tasksStoreChangeTitle(id, title) {
	firebase.db.collection('tasks').doc(id).update({
		title,
		updated: new Date()
	})	

	tasksStore.update(data => {
		data.json[id].title = title
		data.array = (Object.keys(data.json).map(el => data.json[el])).sort((a, b) => b.created.seconds - a.created.seconds)
		return data
	})
}


export function tasksStoreChangeColor(id, color) {
	firebase.db.collection('tasks').doc(id).update({
		color,
		updated: new Date()
	})	

	tasksStore.update(data => {
		data.json[id].color = color
		data.array = (Object.keys(data.json).map(el => data.json[el])).sort((a, b) => b.created.seconds - a.created.seconds)
		return data
	})
}


export function tasksStoreDeleteEntry(id) {
	firebase.db.collection('tasks').doc(id).delete()
}