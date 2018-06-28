const algoliaConfig = require('./secrets/algoliaConfig')
const algoliasearch = require('algoliasearch')

const firebaseConfig = require('./secrets/firebaseConfig')
const admin = require('firebase-admin')
const serviceAccount = require('../secrets/service_account_key.json')

// configure Firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseConfig.FIREBASE_DB_URL
})
const db = firebase.database()

// configure algolia
const algolia = algoliasearch(
  algoliaConfig.ALGOLIA_APP_ID,
  algoliaConfig.ALGOLIA_API_KEY
)

const offersIndex = algolia.initIndex(algoliaConfig.ALGOLIA_OFFERS_INDEX)
const usersIndex = algolia.initIndex(algoliaConfig.ALGOLIA_USERS_INDEX)

const offersRef = db.ref('offers')
const usersRef = db.ref('users')

offersRef.on('child_added', addOrUpdateIndexRecord(offersIndex))
offersRef.on('child_changed', addOrUpdateIndexRecord(offersIndex))
offersRef.on('child_removed', deleteIndexRecord(offersIndex))

usersRef.on('child_added', adOrUpdateIndexRecord(usersIndex))
usersRef.on('child_changed', adOrUpdateIndexRecord(usersIndex))
usersRef.on('child_removed', deleteIndexRecord(usersIndex))

function addOrUpdateIndexRecord(index) {
  return (snapshot) => {
    const record = snapshot.val()

    record.objectID = snapshot.key

    index
      .saveObject(record)
      .then(() => {
        console.log('Firebase object indexed in Algolia', record.objectID)
      })
      .catch(err => {
        console.error('Error when indexing contact into Algolia', err)
      })
  }
}

function deleteIndexRecord(index) {
  return (snapshot) => {
    const objectID = snapshot.key

    index
      .deleteObject(objectID)
      .then(() => {
        console.log('Firebase object deleted from Algolia', objectID)
      })
      .catch(err => {
        console.error('Error when deleting contact from Algolia', err)
      })
  }
}
