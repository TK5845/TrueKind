type AuthChangeCallback = (event: "SIGNED_OUT", session: null) => void;

type DisabledQueryResult = {
  data: null;
  error: Error;
};

type DisabledMutationResult = {
  error: Error;
};

function disabledError(issue: string) {
  return new Error(issue || "Supabase ar inte konfigurerat.");
}

function disabledQuery(issue: string) {
  const result: DisabledQueryResult = {
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
    then<TResult1 = DisabledQueryResult, TResult2 = never>(
      onfulfilled?:
        | ((value: DisabledQueryResult) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };

  return query;
}

function disabledMutation(issue: string) {
  const result: DisabledMutationResult = {
    error: disabledError(issue),
  };

  const query = {
    eq() {
      return query;
    },
    then<TResult1 = DisabledMutationResult, TResult2 = never>(
      onfulfilled?:
        | ((value: DisabledMutationResult) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };

  return query;
}

export function createDisabledSupabaseClient(issue: string) {
  const error = disabledError(issue);

  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async getUser() {
        return { data: { user: null }, error };
      },
      onAuthStateChange(callback: AuthChangeCallback) {
        if (typeof window !== "undefined") {
          window.setTimeout(() => callback("SIGNED_OUT", null), 0);
        }

        return {
          data: {
            subscription: {
              unsubscribe() {},
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
