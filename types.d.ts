interface ObjectConstructor {
	entries<K extends string | number | symbol, V>(o: Record<K, V>): [K, V][];
	keys<K extends string | number | symbol>(o: Record<K, unknown>): K[];
	values<V>(o: Record<string | number | symbol, V>): V[];
}
