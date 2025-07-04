// Background Sync for Service Worker
// Handles syncing data when the app regains connectivity

// Check if we're in a service worker context
if (typeof self !== 'undefined' && self.addEventListener) {
  // Listen for sync events
  self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag)
  
  if (event.tag === '75hard-sync') {
    event.waitUntil(syncData())
  }
})

// Register periodic sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === '75hard-periodic-sync') {
    event.waitUntil(syncData())
  }
})

// Main sync function
async function syncData() {
  try {
    // Get sync queue from IndexedDB or localStorage
    const queue = await getSyncQueue()
    
    if (queue.length === 0) {
      return
    }
    
    console.log(`Syncing ${queue.length} items...`)
    
    // Process each item
    const results = await Promise.allSettled(
      queue.map(item => processSyncItem(item))
    )
    
    // Update queue with failed items
    const failedItems = []
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const item = queue[index]
        item.retries = (item.retries || 0) + 1
        if (item.retries < 3) {
          failedItems.push(item)
        }
      }
    })
    
    // Save updated queue
    await saveSyncQueue(failedItems)
    
    // Notify clients of sync completion
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: {
          total: queue.length,
          failed: failedItems.length
        }
      })
    })
    
  } catch (error) {
    console.error('Background sync error:', error)
  }
}

// Get sync queue from storage
async function getSyncQueue() {
  // Try to use IndexedDB first, fallback to localStorage
  try {
    const cache = await caches.open('75hard-sync-cache')
    const response = await cache.match('/sync-queue')
    if (response) {
      return await response.json()
    }
  } catch (error) {
    console.error('Failed to get sync queue from cache:', error)
  }
  
  return []
}

// Save sync queue to storage
async function saveSyncQueue(queue) {
  try {
    const cache = await caches.open('75hard-sync-cache')
    const response = new Response(JSON.stringify(queue), {
      headers: { 'Content-Type': 'application/json' }
    })
    await cache.put('/sync-queue', response)
  } catch (error) {
    console.error('Failed to save sync queue:', error)
  }
}

// Process individual sync item
async function processSyncItem(item) {
  const { table, action, data } = item
  
  // Get the Supabase URL and key from environment or config
  const supabaseUrl = self.SUPABASE_URL || 'https://xkqtpekoiqnwugyzfrit.supabase.co'
  const supabaseKey = self.SUPABASE_ANON_KEY || ''
  
  let url = `${supabaseUrl}/rest/v1/${table}`
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
  
  let method = 'POST'
  let body = JSON.stringify(data)
  
  switch (action) {
    case 'create':
      // Handle upsert for creates to avoid conflicts
      headers['Prefer'] = 'resolution=merge-duplicates'
      break
    case 'update':
      method = 'PATCH'
      url += `?id=eq.${data.id}`
      break
    case 'delete':
      method = 'DELETE'
      url += `?id=eq.${data.id}`
      body = null
      break
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body
  })
  
  // Handle specific error cases
  if (!response.ok) {
    const errorText = await response.text()
    
    // If it's a unique constraint violation, try update instead
    if (response.status === 409 && action === 'create') {
      method = 'PATCH'
      url += `?id=eq.${data.id}`
      
      const updateResponse = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data)
      })
      
      if (updateResponse.ok) {
        return updateResponse
      }
    }
    
    // If it's a not found error on delete, consider it successful
    if (response.status === 404 && action === 'delete') {
      return response
    }
    
    throw new Error(`Sync failed: ${response.status} - ${errorText}`)
  }
  
  return response
}

// Request background sync when needed
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REQUEST_SYNC') {
    self.registration.sync.register('75hard-sync').catch(error => {
      console.error('Failed to register sync:', error)
      // Fallback to immediate sync
      syncData()
    })
  }
})

} // Close the service worker context check