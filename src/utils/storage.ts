class StorageWrapper {
  private memoryStore = new Map<string, string>();

  hasGDPRConsent(): boolean {
    try {
      return window.localStorage.getItem('gdprConsent') === 'true';
    } catch {
      return false;
    }
  }

  setGDPRConsent(consent: boolean) {
    if (consent) {
      try {
        window.localStorage.setItem('gdprConsent', 'true');
        // Migrate memory store to local storage
        this.memoryStore.forEach((value, key) => {
          window.localStorage.setItem(key, value);
        });
        this.memoryStore.clear();
      } catch (e) {
        console.error('Failed to set GDPR consent:', e);
      }
    } else {
      try {
        window.localStorage.removeItem('gdprConsent');
        this.clear(); // This will clear memory store since hasGDPRConsent is now false
      } catch (e) {
        console.error('Failed to remove GDPR consent:', e);
      }
    }
  }

  getItem(key: string): string | null {
    if (key === 'gdprConsent') {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    if (this.hasGDPRConsent()) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    return this.memoryStore.get(key) || null;
  }

  setItem(key: string, value: string): void {
    if (key === 'gdprConsent') {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      return;
    }

    if (this.hasGDPRConsent()) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    } else {
      this.memoryStore.set(key, value);
    }
  }

  removeItem(key: string): void {
    if (this.hasGDPRConsent()) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error('Failed to remove from localStorage:', e);
      }
    } else {
      this.memoryStore.delete(key);
    }
  }

  clear(): void {
    if (this.hasGDPRConsent()) {
      try {
        const consent = window.localStorage.getItem('gdprConsent');
        window.localStorage.clear();
        if (consent) window.localStorage.setItem('gdprConsent', consent);
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    } else {
      this.memoryStore.clear();
    }
  }

  get length(): number {
    if (this.hasGDPRConsent()) {
      try {
        return window.localStorage.length;
      } catch {
        return 0;
      }
    }
    return this.memoryStore.size;
  }

  key(index: number): string | null {
    if (this.hasGDPRConsent()) {
      try {
        return window.localStorage.key(index);
      } catch {
        return null;
      }
    }
    return Array.from(this.memoryStore.keys())[index] || null;
  }
}

export const storage = new StorageWrapper();
