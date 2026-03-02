// Simple global store for lead management
let leadStore = {
    listeners: [],
    version: 0,
    
    // Subscribe to lead updates
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    },
    
    // Notify all listeners that leads have been updated
    notifyUpdate() {
        this.version++;
        console.log('LeadStore: Notifying all listeners, version:', this.version);
        this.listeners.forEach(callback => {
            try {
                callback(this.version);
            } catch (error) {
                console.error('LeadStore: Error in listener callback:', error);
            }
        });
    },
    
    // Get current version
    getVersion() {
        return this.version;
    }
};

export default leadStore;
