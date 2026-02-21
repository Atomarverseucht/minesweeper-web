package de.htwg.winesmeeper.aView

import de.htwg.winesmeeper.Controller.ControllerTrait
import de.htwg.winesmeeper.Observer
import scala.scalajs.js.annotation.*
import scala.util.Try

@JSExportTopLevel("winesmeeperScala")
@JSExportAll
class WebView(ctrl: ControllerTrait) extends Observer(ctrl):
  def turn(cmd: String): Try[String] = ctrl.turn(observerID, cmd, Try(1), Try(1))

  override def generate(): Unit = {}

  override def update(): Unit = {}

  def getControl: ControllerTrait = ctrl
