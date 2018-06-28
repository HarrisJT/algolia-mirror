const algoliaConfig = require('./secrets/algoliaConfig')
const algoliasearch = require('algoliasearch')

const firebaseConfig = require('./secrets/firebaseConfig')
const admin = require('firebase-admin')
const serviceAccount = require('./secrets/service_account_key.json')

// configure Firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseConfig.FIREBASE_DB_URL
})
const db = admin.database()

// configure algolia
const algolia = algoliasearch(
  algoliaConfig.ALGOLIA_APP_ID,
  algoliaConfig.ALGOLIA_ADMIN_KEY
)

const offersIndex = algolia.initIndex(algoliaConfig.ALGOLIA_OFFERS_INDEX)
const usersIndex = algolia.initIndex(algoliaConfig.ALGOLIA_USERS_INDEX)

const offersRef = db.ref('offers')
const usersRef = db.ref('users')

offersRef.on('child_added', addOrUpdateOfferIndexRecord)
offersRef.on('child_changed', addOrUpdateOfferIndexRecord)
offersRef.on('child_removed', deleteOfferIndexRecord)

usersRef.on('child_added', addOrUpdateUserIndexRecord)
usersRef.on('child_changed', addOrUpdateUserIndexRecord)
usersRef.on('child_removed', deleteUserIndexRecord)

function addOrUpdateOfferIndexRecord (snapshot) {
  const record = snapshot.val()
  record.objectID = snapshot.key
  offersIndex
    .saveObject(record)
    .then(() => {
      console.log('Firebase object indexed in Algolia', record.objectID)
    })
    .catch(err => {
      console.error('Error when indexing contact into Algolia', err)
    })
}

function deleteOfferIndexRecord (snapshot) {
  const objectID = snapshot.key
  offersIndex
    .deleteObject(objectID)
    .then(() => {
      console.log('Firebase object deleted from Algolia', objectID)
    })
    .catch(err => {
      console.error('Error when deleting contact from Algolia', err)
    })
}

function addOrUpdateUserIndexRecord (snapshot) {
  const record = snapshot.val()
  record.objectID = snapshot.key

  admin.auth().getUser(snapshot.key).then((details) => {
    record.displayName = details.displayName
    record.emailVerified = details.emailVerified
    record.disabled = details.disabled
    record.uid = details.uid

    usersIndex
      .saveObject(record)
      .then(() => {
        console.log('Firebase object indexed in Algolia', record.objectID)
      })
      .catch(err => {
        console.error('Error when indexing user into Algolia', err)
      })
  }).catch((err) => {
    console.error('Error when retrieving user info from Firebase Auth', err)
  })
}

function deleteUserIndexRecord (snapshot) {
  const objectID = snapshot.key
  
  usersIndex
    .deleteObject(objectID)
    .then(() => {
      console.log('Firebase object deleted from Algolia', objectID)
    })
    .catch(err => {
      console.error('Error when deleting user from Algolia', err)
    })
}