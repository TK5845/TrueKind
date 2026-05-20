"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDisabledSupabaseClient = createDisabledSupabaseClient;
function disabledError(issue) {
    return new Error(issue || "Supabase ar inte konfigurerat.");
}
function disabledQuery(issue) {
    const result = {
        data: null,
        error: disabledError(issue),
    };
    const query = {
        eq() {
            return query;
        },
        order() {
            return query;
        },
        maybeSingle() {
            return Promise.resolve(result);
        },
        then(onfulfilled, onrejected) {
            return Promise.resolve(result).then(onfulfilled, onrejected);
        },
    };
    return query;
}
function disabledMutation(issue) {
    const result = {
        error: disabledError(issue),
    };
    const query = {
        eq() {
            return query;
        },
        then(onfulfilled, onrejected) {
            return Promise.resolve(result).then(onfulfilled, onrejected);
        },
    };
    return query;
}
function createDisabledSupabaseClient(issue) {
    const error = disabledError(issue);
    return {
        auth: {
            async getSession() {
                return { data: { session: null }, error: null };
            },
            async getUser() {
                return { data: { user: null }, error };
            },
            onAuthStateChange(callback) {
                if (typeof window !== "undefined") {
                    window.setTimeout(() => callback("SIGNED_OUT", null), 0);
                }
                return {
                    data: {
                        subscription: {
                            unsubscribe() { },
                        },
                    },
                };
            },
            async signInWithPassword() {
                return { data: { user: null, session: null }, error };
            },
            async signUp() {
                return { data: { user: null, session: null }, error };
            },
            async signOut() {
                return { error: null };
            },
        },
        from() {
            return {
                select() {
                    return disabledQuery(issue);
                },
                update() {
                    return disabledMutation(issue);
                },
                insert() {
                    return Promise.resolve({ error });
                },
                upsert() {
                    return Promise.resolve({ error });
                },
            };
        },
        storage: {
            from() {
                return {
                    upload() {
                        return Promise.resolve({ data: null, error });
                    },
                    remove() {
                        return Promise.resolve({ data: null, error });
                    },
                    getPublicUrl() {
                        return { data: { publicUrl: "" } };
                    },
                };
            },
        },
    };
}
