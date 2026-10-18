package com.saitama21.hochu

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.json.JSONArray
import org.json.JSONObject

data class Wish(val title: String, val price: String, val done: Boolean)

class MainActivity : ComponentActivity() {
    private val prefs by lazy { getSharedPreferences("wishes", MODE_PRIVATE) }

    private fun load(): List<Wish> = try {
        val array = JSONArray(prefs.getString("items", "[]"))
        (0 until array.length()).map {
            val o = array.getJSONObject(it)
            Wish(o.optString("title"), o.optString("price"), o.optBoolean("done"))
        }
    } catch (_: Exception) { emptyList() }

    private fun save(list: List<Wish>) {
        val array = JSONArray()
        list.forEach { array.put(JSONObject().put("title", it.title).put("price", it.price).put("done", it.done)) }
        prefs.edit().putString("items", array.toString()).apply()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            var wishes by remember { mutableStateOf(load()) }
            var title by remember { mutableStateOf("") }
            var price by remember { mutableStateOf("") }
            MaterialTheme {
                Scaffold(topBar = { Surface(tonalElevation = 4.dp) {
                    Text("Желания", modifier = Modifier.padding(20.dp), style = MaterialTheme.typography.headlineMedium)
                } }) { padding ->
                    Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                        Text("Мой список желаний", style = MaterialTheme.typography.titleLarge)
                        Spacer(Modifier.height(12.dp))
                        OutlinedTextField(title, { title = it }, label = { Text("Что хочешь купить?") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(price, { price = it }, label = { Text("Цена, ₴") }, modifier = Modifier.fillMaxWidth())
                        Spacer(Modifier.height(8.dp))
                        Button(onClick = {
                            if (title.isNotBlank()) {
                                wishes = wishes + Wish(title.trim(), price.trim(), false)
                                save(wishes); title = ""; price = ""
                            }
                        }, modifier = Modifier.fillMaxWidth()) { Text("Добавить желание") }
                        Spacer(Modifier.height(12.dp))
                        Text("Всего: ${wishes.size} · Куплено: ${wishes.count { it.done }}")
                        LazyColumn {
                            items(wishes.indices.toList()) { index ->
                                val wish = wishes[index]
                                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                    Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Checkbox(wish.done, onCheckedChange = { checked ->
                                            wishes = wishes.toMutableList().also { it[index] = wish.copy(done = checked) }
                                            save(wishes)
                                        })
                                        Column(Modifier.weight(1f)) {
                                            Text(wish.title, style = MaterialTheme.typography.titleMedium)
                                            if (wish.price.isNotEmpty()) Text("${wish.price} ₴")
                                        }
                                        TextButton(onClick = {
                                            wishes = wishes.toMutableList().also { it.removeAt(index) }
                                            save(wishes)
                                        }) { Text("Удалить") }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
