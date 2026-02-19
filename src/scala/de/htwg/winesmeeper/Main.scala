package de.htwg.winesmeeper

import de.htwg.winesmeeper.Config

val initVals = new Array[Int](5)
  
@main def start: Unit =
  val gb = Config.startBoard
  val ctrl = Config.startController(gb)
