package io.freetubeapp.freetube.helpers

import io.freetubeapp.freetube.javascript.AsyncJSCommunicator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID.randomUUID

class Promise<T, G>(coroutineScope: CoroutineScope, runnable: ((T) -> Unit, (G) -> Unit) -> Unit) {
  private val successListeners: MutableList<(T) -> Unit> = mutableListOf()
  private var successResult: T? = null
  private val errorListeners: MutableList<(G) -> Unit> = mutableListOf()
  private var errorResult: G? = null
  private val id = "${randomUUID()}"

  constructor(runnable: ((T) -> Unit, (G) -> Unit) -> Unit): this(CoroutineScope(Dispatchers.IO), runnable)

  init {
    coroutineScope.launch {
      runnable.invoke({ result ->
        notifySuccess(result)
      }, { result ->
        notifyError(result)
      })
    }
  }

  fun addJsCommunicator(communicator: AsyncJSCommunicator) : String {
    then {
      communicator.resolve(id, "$it")
    }
    catch {
      communicator.reject(id, "$it")
    }
    return id
  }

  private fun notifySuccess(result: T) {
    successResult = result
    successListeners.forEach {
      listener ->
      listener.invoke(result)
    }
  }

  private fun notifyError(result: G) {
    errorResult = result
    errorListeners.forEach {
      listener ->
      listener.invoke(result)
    }
  }

  fun then(listener: (T) -> Unit): Promise<T, G> {
    val result = successResult
    if (result != null) {
      listener(result)
    } else {
      successListeners.add(listener)
    }
    return this
  }

  @SuppressWarnings // will complain that it could be private, but it is public on purpose
  fun catch(listener: (G) -> Unit): Promise<T, G> {
    val result = errorResult
    if (result != null) {
      listener(result)
    } else {
      errorListeners.add(listener)
    }
    return this
  }
}
